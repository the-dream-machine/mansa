import {
	type Sender,
	createMachine,
	assign,
	type DoneInvokeEvent,
	spawn,
	type ActorRef,
} from 'xstate';

import {generateSteps} from '../utils/api/generateSteps.js';
import {type NavigationMachineEvent} from './navigationMachine.js';
import {StepType, type Step} from '../types/Step.js';
import {
	type CreateFileMachineEvent,
	createFileMachine,
} from './createFileMachine.js';
import {
	type ModifyFileMachineEvent,
	initialModifyFileMachineContext,
} from './modifyFileMachine.js';
import {modifyFileMachine} from './modifyFileMachine.js';
import {StepsEvent} from '../types/Steps.js';
import {
	type ExecuteCommandMachineEvent,
	executeCommandMachine,
	initialExecuteCommandMachineContext,
} from './executeCommandMachine.js';
import type {Run, RunStatusResponse} from '../types/Run.js';
import {generateStepsStatus} from '../utils/api/generateStepsStatus.js';
import {fetchAllSteps} from '../utils/api/fetchAllSteps.js';
import {sleep} from 'zx';

// Context
export interface StepsMachineContext {
	run?: Run;
	steps?: Step[];
	activeStepIndex: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	activeStepActor?:
		| ActorRef<CreateFileMachineEvent>
		| ActorRef<ModifyFileMachineEvent>
		| ActorRef<ExecuteCommandMachineEvent>;
	navigate?: Sender<NavigationMachineEvent>;
}

const initialContext: StepsMachineContext = {
	run: undefined,
	steps: [],
	activeStepIndex: 0,
	activeStepActor: undefined,
};

// States
export enum StepsState {
	GENERATE_STEPS = 'GENERATE_STEPS',
	POLLING_GENERATE_STEPS_STATUS = 'POLLING_GENERATE_STEPS_STATUS',
	FETCHING_ALL_STEPS = 'FETCHING_ALL_STEPS',
	SPAWNING_ACTIVE_STEP_MACHINE = 'SPAWNING_ACTIVE_STEP_MACHINE',
	ACTIVE_STEP_IDLE = 'ACTIVE_STEP_IDLE',
	FETCHING_NEXT_STEP = 'FETCHING_NEXT_STEP',
	STEPS_COMPLETE = 'STEPS_COMPLETE',
}

//  State machine states
export type StepsMachineState =
	| {
			value: StepsState.GENERATE_STEPS;
			context: StepsMachineContext;
	  }
	| {
			value: StepsState.POLLING_GENERATE_STEPS_STATUS;
			context: StepsMachineContext;
	  }
	| {
			value: StepsState.FETCHING_ALL_STEPS;
			context: StepsMachineContext;
	  }
	| {
			value: StepsState.SPAWNING_ACTIVE_STEP_MACHINE;
			context: StepsMachineContext;
	  }
	| {value: StepsState.ACTIVE_STEP_IDLE; context: StepsMachineContext}
	| {value: StepsState.FETCHING_NEXT_STEP; context: StepsMachineContext}
	| {value: StepsState.STEPS_COMPLETE; context: StepsMachineContext};

//  State machine events
export type StepsMachineEvent = {type: StepsEvent.NAVIGATE_NEXT_STEP};

// Guards
const isCreateFile = (context: StepsMachineContext) =>
	context.steps?.[context.activeStepIndex]?.step_type === StepType.CREATE_FILE;
const isRunBashCommand = (context: StepsMachineContext) =>
	context.steps?.[context.activeStepIndex]?.step_type ===
	StepType.RUN_BASH_COMMAND;
const isModifyFile = (context: StepsMachineContext) =>
	context.steps?.[context.activeStepIndex]?.step_type === StepType.MODIFY_FILE;

export const stepsMachine = createMachine<
	StepsMachineContext,
	StepsMachineEvent,
	StepsMachineState
>({
	id: 'stepsMachine',
	predictableActionArguments: true,
	initial: StepsState.GENERATE_STEPS,
	context: initialContext,
	states: {
		[StepsState.GENERATE_STEPS]: {
			invoke: {
				src: async () => await generateSteps(),
				onDone: {
					target: StepsState.POLLING_GENERATE_STEPS_STATUS,
					actions: assign({
						run: (_, event: DoneInvokeEvent<Run>) => event.data,
					}),
				},
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log('generate steps error: ', event.data),
				},
			},
		},
		[StepsState.POLLING_GENERATE_STEPS_STATUS]: {
			invoke: {
				src: async context => {
					if (context.run) {
						await sleep(1000);
						return await generateStepsStatus(context.run);
					} else {
						throw new Error('Run ID not found in context');
					}
				},
				onDone: [
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							event.data.status !== 'completed',
						target: StepsState.POLLING_GENERATE_STEPS_STATUS,
					},
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							event.data.status === 'completed',
						target: StepsState.FETCHING_ALL_STEPS,
					},
				],
			},
		},
		[StepsState.FETCHING_ALL_STEPS]: {
			invoke: {
				src: async context => {
					if (context.run) {
						return await fetchAllSteps(context.run);
					} else {
						throw new Error('Thread ID not found in context');
					}
				},
				onDone: {
					target: StepsState.SPAWNING_ACTIVE_STEP_MACHINE,
					actions: assign({
						steps: (_, event: DoneInvokeEvent<Step[]>) => event.data,
					}),
				},
			},
		},
		[StepsState.SPAWNING_ACTIVE_STEP_MACHINE]: {
			always: [
				{
					cond: isCreateFile,
					target: StepsState.ACTIVE_STEP_IDLE,
					actions: assign({
						activeStepActor: context => {
							const newFileToCreate =
								context.steps?.[context.activeStepIndex]
									?.new_file_path_to_create;
							return spawn(
								createFileMachine.withContext({
									enterLabel: 'create file',
									rawCode: newFileToCreate?.file_code_changes,
									filePath: newFileToCreate?.file_path,
									fileExtension: newFileToCreate?.file_extension,
								}),
							);
						},
					}),
				},
				{
					cond: isModifyFile,
					target: StepsState.ACTIVE_STEP_IDLE,
					actions: assign({
						activeStepActor: context => {
							const existingFileToModify =
								context.steps?.[context.activeStepIndex]
									?.existing_file_path_to_modify;

							return spawn(
								modifyFileMachine.withContext({
									...initialModifyFileMachineContext,
									originalFilePath: existingFileToModify?.file_path ?? '',
									originalFileExtension:
										existingFileToModify?.file_extension ?? '',
									originalFileSummary:
										existingFileToModify?.current_file_content_summary ?? '',
									editedFileChangesSummary:
										existingFileToModify?.file_content_summary ?? '',
								}),
							);
						},
					}),
				},
				{
					cond: isRunBashCommand,
					target: StepsState.ACTIVE_STEP_IDLE,
					actions: assign({
						activeStepActor: context =>
							spawn(
								executeCommandMachine.withContext({
									...initialExecuteCommandMachineContext,
									bashCommand:
										context.steps?.[context.activeStepIndex]
											?.bash_command_to_run ?? '',
								}),
							),
					}),
				},
			],
		},
		[StepsState.ACTIVE_STEP_IDLE]: {
			on: {
				[StepsEvent.NAVIGATE_NEXT_STEP]: {
					target: StepsState.FETCHING_NEXT_STEP,
				},
			},
		},
		[StepsState.FETCHING_NEXT_STEP]: {
			always: [
				{
					target: StepsState.SPAWNING_ACTIVE_STEP_MACHINE,
					actions: assign({
						activeStepIndex: context => context.activeStepIndex + 1,
					}),
					cond: context =>
						context.steps?.length !== context.activeStepIndex - 1,
				},
				{
					target: StepsState.STEPS_COMPLETE,
					cond: context =>
						context.steps?.length === context.activeStepIndex - 1,
				},
			],
		},
		[StepsState.STEPS_COMPLETE]: {},
	},
});
