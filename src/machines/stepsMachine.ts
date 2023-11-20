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
import {sleep} from 'zx';
import {
	type CreateFileMachineEvent,
	createFileMachine,
} from './createFileMachine.js';

// Context
export interface StepsMachineContext {
	steps?: Step[];
	activeStepIndex: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	activeStepActor: ActorRef<CreateFileMachineEvent> | undefined;
	navigate?: Sender<NavigationMachineEvent>;
}

// States
export enum StepsState {
	GENERATING_STEPS = 'GENERATING_STEPS',
	SPAWNING_ACTIVE_STEP_MACHINE = 'SPAWNING_ACTIVE_STEP_MACHINE',
	ACTIVE_STEP_IDLE = 'ACTIVE_STEP_IDLE',
	ACTIVE_STEP_RUNNING = 'ACTIVE_STEP_RUNNING',
	ACTIVE_STEP_SUCCESS_IDLE = 'ACTIVE_STEP_SUCCESS_IDLE',
	ACTIVE_STEP_ERROR_IDLE = 'ACTIVE_STEP_ERROR_IDLE',
	FETCHING_NEXT_STEP = 'FETCHING_NEXT_STEP',
	STEPS_COMPLETE = 'STEPS_COMPLETE',
}

//  State machine states
export type StepsMachineState =
	| {value: StepsState.GENERATING_STEPS; context: StepsMachineContext}
	| {
			value: StepsState.SPAWNING_ACTIVE_STEP_MACHINE;
			context: StepsMachineContext;
	  }
	| {value: StepsState.ACTIVE_STEP_IDLE; context: StepsMachineContext}
	| {value: StepsState.ACTIVE_STEP_RUNNING; context: StepsMachineContext}
	| {value: StepsState.ACTIVE_STEP_SUCCESS_IDLE; context: StepsMachineContext}
	| {value: StepsState.ACTIVE_STEP_ERROR_IDLE; context: StepsMachineContext}
	| {value: StepsState.FETCHING_NEXT_STEP; context: StepsMachineContext}
	| {value: StepsState.STEPS_COMPLETE; context: StepsMachineContext};

export enum StepsEvent {
	ENTER_PRESSED = 'ENTER_PRESSED',
}

//  State machine events
export type StepsMachineEvent = {type: StepsEvent.ENTER_PRESSED};

// Guards

export const stepsMachine = createMachine<
	StepsMachineContext,
	StepsMachineEvent,
	StepsMachineState
>({
	id: 'stepsMachine',
	predictableActionArguments: true,
	initial: StepsState.GENERATING_STEPS,
	context: {
		steps: [],
		activeStepIndex: 4,
		activeStepActor: undefined,
	},
	states: {
		[StepsState.GENERATING_STEPS]: {
			invoke: {
				src: async () => await generateSteps(),
				onDone: [
					{
						target: StepsState.SPAWNING_ACTIVE_STEP_MACHINE,
						actions: assign({
							steps: (_, event: DoneInvokeEvent<Step[]>) => event.data,
						}),
					},
				],
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log('generate steps error: ', event.data),
				},
			},
		},
		[StepsState.SPAWNING_ACTIVE_STEP_MACHINE]: {
			always: [
				{
					cond: context =>
						context.steps?.[context.activeStepIndex]?.step_type ===
						StepType.CREATE_FILE,
					actions: assign({
						activeStepActor: context =>
							spawn(
								createFileMachine.withContext({
									rawCode:
										context.steps?.[context.activeStepIndex]
											?.new_file_path_to_create?.file_code_changes ?? '',
									filePath:
										context.steps?.[context.activeStepIndex]
											?.new_file_path_to_create?.file_path ?? '',
									fileExtension:
										context.steps?.[context.activeStepIndex]
											?.new_file_path_to_create?.file_extension ?? '',
									formattedCode: '',
									highlightedCode: '',
									enterLabel: 'create file',
								}),
							),
					}),
					target: StepsState.ACTIVE_STEP_IDLE,
				},
				{
					cond: context =>
						context.steps?.[context.activeStepIndex]?.step_type ===
						StepType.RUN_BASH_COMMAND,
					target: StepsState.ACTIVE_STEP_IDLE,
				},
			],
		},
		[StepsState.ACTIVE_STEP_IDLE]: {
			on: {
				[StepsEvent.ENTER_PRESSED]: {
					target: StepsState.ACTIVE_STEP_RUNNING,
				},
			},
		},
		[StepsState.ACTIVE_STEP_RUNNING]: {
			invoke: {
				src: async () => await sleep(3500),
				onDone: {
					target: StepsState.ACTIVE_STEP_SUCCESS_IDLE,
				},
			},
		},
		[StepsState.ACTIVE_STEP_SUCCESS_IDLE]: {
			on: {
				[StepsEvent.ENTER_PRESSED]: {
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
