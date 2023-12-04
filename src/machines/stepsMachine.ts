// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {
	createMachine,
	assign,
	spawn,
	type Sender,
	type ActorRef,
	type DoneInvokeEvent,
} from 'xstate';

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
import {StepsEvent} from '../types/StepsMachine.js';
import {
	type ExecuteCommandMachineEvent,
	executeCommandMachine,
	initialExecuteCommandMachineContext,
} from './executeCommandMachine.js';
import type {Run} from '../types/Run.js';
import {sendQueryMachine} from './sendQueryMachine.js';
import {initialSendQueryMachineContext} from '../utils/initialSendQueryMachineContext.js';
import {getRepositoryConfig} from '../utils/repository/getRepositoryConfig.js';
import type {RepoConfig} from '../types/Repo.js';
import {getRepositoryMap} from '../utils/repository/getRepositoryMap.js';
import {AIStepsResponseSchema} from '../utils/schema/AISteps.js';
import {type FileMapItem} from '../types/FileMapItem.js';

// Context
export interface StepsMachineContext {
	run?: Run;
	repositoryMap?: FileMapItem[];
	repositoryConfig?: RepoConfig;
	stepsSummary?: string;
	steps?: Step[];
	activeStepIndex: number;
	activeStepActor?:
		| ActorRef<CreateFileMachineEvent>
		| ActorRef<ModifyFileMachineEvent>
		| ActorRef<ExecuteCommandMachineEvent>;
	navigate?: Sender<NavigationMachineEvent>;

	isStepsSummaryLoading: boolean;
	isStepsSummarySuccess: boolean;
	isStepsSummaryError: boolean;

	isStepsLoading: boolean;
	isStepsSuccess: boolean;
	isStepsError: boolean;
}

// States
export enum StepsState {
	FETCHING_REPOSITORY_MAP = 'FETCHING_REPOSITORY_MAP',
	FETCHING_REPOSITORY_CONFIG = 'FETCHING_REPOSITORY_CONFIG',
	GENERATING_STEPS_SUMMARY = 'GENERATING_STEPS_SUMMARY',
	GENERATING_STEPS = 'GENERATING_STEPS',
	REVIEW_STEPS_IDLE = 'REVIEW_STEPS_IDLE',
	SPAWNING_ACTIVE_STEP_MACHINE = 'SPAWNING_ACTIVE_STEP_MACHINE',
	ACTIVE_STEP_IDLE = 'ACTIVE_STEP_IDLE',
	FETCHING_NEXT_STEP = 'FETCHING_NEXT_STEP',
	STEPS_COMPLETE = 'STEPS_COMPLETE',
}

export type StepsMachineState =
	| {
			value: StepsState.FETCHING_REPOSITORY_MAP;
			context: StepsMachineContext;
	  }
	| {
			value: StepsState.FETCHING_REPOSITORY_CONFIG;
			context: StepsMachineContext;
	  }
	| {
			value: StepsState.GENERATING_STEPS_SUMMARY;
			context: StepsMachineContext;
	  }
	| {
			value: StepsState.GENERATING_STEPS;
			context: StepsMachineContext;
	  }
	| {
			value: StepsState.REVIEW_STEPS_IDLE;
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
export type StepsMachineEvent =
	| {type: StepsEvent.NAVIGATE_NEXT_STEP}
	| {type: StepsEvent.ENTER_KEY_PRESS}
	| {type: StepsEvent.UPDATE_RUN; run: Run};

// Guards
const isCreateFile = (context: StepsMachineContext) =>
	context.steps?.[context.activeStepIndex]?.step_type === StepType.CREATE_FILE;
const isRunBashCommand = (context: StepsMachineContext) =>
	context.steps?.[context.activeStepIndex]?.step_type ===
	StepType.RUN_BASH_COMMAND;
const isModifyFile = (context: StepsMachineContext) =>
	context.steps?.[context.activeStepIndex]?.step_type === StepType.MODIFY_FILE;

// Actions
enum StepsActions {
	toggleStepsSummaryLoading = 'toggleStepsSummaryLoading',
	toggleStepsSummarySuccess = 'toggleStepsSummarySuccess',
	toggleStepsSummaryError = 'toggleStepsSummaryError',

	toggleStepsLoading = 'toggleStepsLoading',
	toggleStepsSuccess = 'toggleStepsSuccess',
	toggleStepsError = 'toggleStepsError',
}

// Initial context
const initialContext: StepsMachineContext = {
	run: undefined,
	repositoryMap: [],
	repositoryConfig: undefined,
	stepsSummary: '',
	steps: [
		{
			step_title: 'Install Trigger.dev SDK and Next.js Integration',
			step_description:
				'This step adds required packages for Trigger.dev and its integration with Next.js to the project. It provides foundational components needed to define and run jobs within the application.',
			step_type: 'RUN_BASH_COMMAND',
			bash_command_to_run: 'bun add @trigger.dev/sdk @trigger.dev/nextjs',
		},
		{
			step_title: 'Create Trigger Client Configuration File',
			step_description:
				'This file stores the configuration needed to initialize the Trigger Client, such as the project ID and API key. It serves as a central point for Trigger.dev client usage within the project.',
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/trigger.ts',
				file_extension: 'ts',
				file_content_summary:
					'This file initializes the Trigger Client with the project identifier and API credentials.',
				file_code_changes:
					"import { TriggerClient } from '@trigger.dev/sdk'; export const client = new TriggerClient({ id: 'my-app', /* Replace 'my-app' with the identifier for your project */ apiKey: process.env.TRIGGER_API_KEY, apiUrl: process.env.TRIGGER_API_URL, });",
			},
		},
		{
			step_title: 'Configure Environment Variables',
			step_description:
				'Add the Trigger.dev API key and API URL to the appropriate environment configuration file to securely store and access them within the application.',
			step_type: 'MODIFY_FILE',
			existing_file_path_to_modify: {
				file_path: './src/env.mjs',
				file_extension: 'mjs',
				current_file_content_summary:
					'This file contains the logic for creating environment variables for a Next.js application. It defines server-side and client-side environment variables schemas using zod, and also handles runtime environment variables. It includes options for skipping environment validation and treating empty strings as undefined.',
				file_content_summary:
					"Update or expand the environment variables schema to include 'TRIGGER_API_KEY' and optionally 'TRIGGER_API_URL', ensuring these new variables are loaded and validated correctly within the application.",
			},
		},
		{
			step_title: 'Set Up Trigger.dev API Route',
			step_description:
				'This file creates an API route specifically for handling Trigger.dev webhooks and jobs. It acts as a gateway for Trigger.dev triggers and jobs within the application.',
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/pages/api/trigger.ts',
				file_extension: 'ts',
				file_content_summary:
					'This file initializes the necessary routing for handling Trigger.dev requests.',
				file_code_changes:
					"import { createPagesRoute } from '@trigger.dev/nextjs'; import { client } from '../../trigger'; /* Adjust path if needed */ export const { handler, config } = createPagesRoute(client); export { config }; export default handler;",
			},
		},
		{
			step_title: 'Create Jobs Directory and Example Job File',
			step_description:
				'This directory holds the job definitions for the application, and the example file defines a sample job to demonstrate the usage of Trigger.dev SDK.',
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/Jobs/example.ts',
				file_extension: 'ts',
				file_content_summary:
					"This file includes the definition for the first job within the project, specifying its trigger event and the job's run function.",
				file_code_changes:
					"import { eventTrigger } from '@trigger.dev/sdk'; import { client } from '../trigger'; /* Adjust path if needed */ client.defineJob({ id: 'example-job', name: 'Example Job', version: '0.0.1', trigger: eventTrigger({ name: 'example.event', }), run: async (payload, io, ctx) => { await io.logger.info('Hello world!', { payload }); return { message: 'Hello world!', }; }, });",
			},
		},
		{
			step_title: 'Create Jobs Index File',
			step_description:
				'This file serves as a hub to export all the job definitions in the Jobs directory for ease of management and reference within the project.',
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/Jobs/index.ts',
				file_extension: 'ts',
				file_content_summary:
					'This file gathers and exports all job definitions for easy import elsewhere in the application.',
				file_code_changes:
					"// import all your job files here export * from './example'; // export * from './other-job-file' (if you have more job files)",
			},
		},
		{
			step_title: 'Update package.json with Trigger.dev Configuration',
			step_description:
				'Include the Trigger.dev configuration in the package.json to identify the endpoint for Trigger.dev webhooks. This helps Trigger.dev to correctly interface with the project.',
			step_type: 'MODIFY_FILE',
			existing_file_path_to_modify: {
				file_path: './package.json',
				file_extension: 'json',
				current_file_content_summary:
					"The package.json file contains metadata and configuration for the 'ragdoll' project, which is a Next.js application written in TypeScript and uses various libraries such as Prisma, React Query, TRPC, Zod, Superjson, and others for backend and frontend development, testing, and linting.",
				file_content_summary:
					"Add a new configuration object for 'trigger.dev' in the package.json to specify the Trigger.dev endpoint identifier.",
			},
		},
		{
			step_title: 'Run Next.js in Development Mode',
			step_description:
				'Start the Next.js development server to test the application with the newly added Trigger.dev configuration.',
			step_type: 'RUN_BASH_COMMAND',
			bash_command_to_run: 'bun run dev',
		},
		{
			step_title: 'Start Trigger.dev CLI',
			step_description:
				'Open a new terminal window or tab and execute this command to start the Trigger.dev CLI in development mode. This is necessary for testing and interacting with Trigger.dev jobs locally.',
			step_type: 'USER_ACTION',
			bash_command_to_run: 'bunx @trigger.dev/cli@latest dev',
		},
	],
	activeStepIndex: 1,
	activeStepActor: undefined,

	isStepsSummaryLoading: false,
	isStepsSummarySuccess: false,
	isStepsSummaryError: false,

	isStepsLoading: false,
	isStepsSuccess: false,
	isStepsError: false,
};

type SendQueryMachineResult<TResult> = {
	run: Run;
	result: TResult;
};

export const stepsMachine = createMachine<
	StepsMachineContext,
	StepsMachineEvent,
	StepsMachineState
>(
	{
		id: 'stepsMachine',
		predictableActionArguments: true,
		initial: StepsState.SPAWNING_ACTIVE_STEP_MACHINE,
		context: initialContext,
		states: {
			[StepsState.FETCHING_REPOSITORY_MAP]: {
				invoke: {
					src: async () => await getRepositoryMap(),
					onDone: {
						target: StepsState.FETCHING_REPOSITORY_CONFIG,
						actions: assign({
							repositoryMap: (_, event: DoneInvokeEvent<FileMapItem[]>) =>
								event.data,
						}),
					},
				},
			},
			[StepsState.FETCHING_REPOSITORY_CONFIG]: {
				invoke: {
					src: async () => await getRepositoryConfig(),
					onDone: {
						target: StepsState.GENERATING_STEPS_SUMMARY,
						actions: assign({
							repositoryConfig: (_, event: DoneInvokeEvent<RepoConfig>) =>
								event.data,
						}),
					},
				},
			},
			[StepsState.GENERATING_STEPS_SUMMARY]: {
				entry: [StepsActions.toggleStepsSummaryLoading],
				invoke: {
					src: context => {
						const projectSummary = context.repositoryMap?.find(
							fileMapItem => fileMapItem.filePath === 'package.json',
						)?.fileSummary;

						return sendQueryMachine.withContext({
							...initialSendQueryMachineContext,
							query: `package.json summary: ${projectSummary}
Package manager: ${context.repositoryConfig?.packageManager}.
Question: Given this information, how do I manually setup 'trigger.dev' in my project? (Respond with numbered steps)`,
							skipTransform: true,
						});
					},
					onDone: {
						target: StepsState.GENERATING_STEPS,
						actions: [
							StepsActions.toggleStepsSummaryLoading,
							StepsActions.toggleStepsSummarySuccess,
							assign(
								(
									_,
									event: DoneInvokeEvent<SendQueryMachineResult<string>>,
								) => ({
									stepsSummary: event.data.result,
									run: event.data.run,
								}),
							),
						],
					},
					onError: {
						actions: (_, event: DoneInvokeEvent<Error>) =>
							console.log('generate steps summary error: ', event.data),
					},
				},
			},
			[StepsState.GENERATING_STEPS]: {
				entry: [
					StepsActions.toggleStepsLoading,
					context => {
						console.log('GENERATING_STEPS RUN:', JSON.stringify(context.run));
					},
				],
				invoke: {
					src: context =>
						sendQueryMachine.withContext({
							...initialSendQueryMachineContext,
							query: `Here is an overview of my project showing the location and the purpose of each file: ${JSON.stringify(
								context.repositoryMap,
							)}
Question: How do I apply these steps to my project? 
Comments: From the project map, you should infer the appropriate files to create and modify when necessary. Suggest the commands to run. No preamble. Do NOT omit any steps. Only respond in the following JSON schema: ${JSON.stringify(
								AIStepsResponseSchema,
							)}`,
							thread_id: context.run?.thread_id,
							responseParentKey: 'steps',
						}),
					onDone: {
						target: StepsState.REVIEW_STEPS_IDLE,
						actions: [
							StepsActions.toggleStepsLoading,
							StepsActions.toggleStepsSuccess,
							assign(
								(
									_,
									event: DoneInvokeEvent<
										SendQueryMachineResult<{steps: Step[]}>
									>,
								) => ({
									steps: event.data.result.steps,
									run: event.data.run,
								}),
							),
						],
					},
					onError: {
						actions: (_, event: DoneInvokeEvent<Error>) =>
							console.log('generate steps error: ', event.data),
					},
				},
			},
			[StepsState.REVIEW_STEPS_IDLE]: {
				on: {
					[StepsEvent.ENTER_KEY_PRESS]: {
						target: StepsState.SPAWNING_ACTIVE_STEP_MACHINE,
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
	},
	{
		actions: {
			[StepsActions.toggleStepsSummaryLoading]: assign({
				isStepsSummaryLoading: context => !context.isStepsSummaryLoading,
			}),
			[StepsActions.toggleStepsSummarySuccess]: assign({
				isStepsSummarySuccess: context => !context.isStepsSummarySuccess,
			}),
			[StepsActions.toggleStepsSummaryError]: assign({
				isStepsSummaryLoading: context => !context.isStepsSummaryError,
			}),

			[StepsActions.toggleStepsLoading]: assign({
				isStepsLoading: context => !context.isStepsLoading,
			}),
			[StepsActions.toggleStepsSuccess]: assign({
				isStepsSuccess: context => !context.isStepsSuccess,
			}),
			[StepsActions.toggleStepsError]: assign({
				isStepsLoading: context => !context.isStepsError,
			}),
		},
	},
);
