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
import {
	type CreateFileMachineEvent,
	createFileMachine,
	initialCreateFileMachineContext,
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

import {
	initialUserActionContext,
	type UserActionMachineEvent,
} from './userActionMachine.js';
import type {Run} from '../types/Run.js';
import {sendQueryMachine} from './sendQueryMachine.js';
import {initialSendQueryMachineContext} from '../utils/initialSendQueryMachineContext.js';
import {getRepositoryConfig} from '../utils/repository/getRepositoryConfig.js';
import type {RepoConfig} from '../types/Repo.js';
import {getRepositoryMap} from '../utils/repository/getRepositoryMap.js';
import {type FileMapItem} from '../types/FileMapItem.js';
import {type SendQueryMachineResult} from '../types/SendQuery.js';
import {userActionMachine} from './userActionMachine.js';
import {StepsSchema, StepType} from '../utils/schema/Steps.js';
import {type Static} from '@sinclair/typebox';

type Step = Static<typeof StepsSchema>;

// Context
export interface StepsMachineContext {
	run?: Run;
	repositoryMap?: FileMapItem[];
	repositoryConfig?: RepoConfig;
	stepsSummary?: string;
	personalizedSteps?: string;
	steps?: Step[];
	activeStepIndex: number;
	activeStepActor?:
		| ActorRef<CreateFileMachineEvent>
		| ActorRef<ModifyFileMachineEvent>
		| ActorRef<ExecuteCommandMachineEvent>
		| ActorRef<UserActionMachineEvent>;
	navigate?: Sender<NavigationMachineEvent>;

	isStepsSummaryLoading: boolean;
	isStepsSummarySuccess: boolean;
	isStepsSummaryError: boolean;

	isPersonalizingStepsLoading: boolean;
	isPersonalizingStepsSuccess: boolean;
	isPersonalizingStepsError: boolean;

	isGeneratingStepsLoading: boolean;
	isGeneratingStepsSuccess: boolean;
	isGeneratingStepsError: boolean;
}

// States
export enum StepsState {
	FETCHING_REPOSITORY_MAP = 'FETCHING_REPOSITORY_MAP',
	FETCHING_REPOSITORY_CONFIG = 'FETCHING_REPOSITORY_CONFIG',
	GENERATING_STEPS_SUMMARY = 'GENERATING_STEPS_SUMMARY',
	PERSONALIZING_STEPS_SUMMARY = 'PERSONALIZING_STEPS_SUMMARY',
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
			value: StepsState.PERSONALIZING_STEPS_SUMMARY;
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
const isUserAction = (context: StepsMachineContext) =>
	context.steps?.[context.activeStepIndex]?.step_type === StepType.USER_ACTION;

// Initial context
const initialStepsMachineContext: StepsMachineContext = {
	run: undefined,
	repositoryMap: [],
	repositoryConfig: undefined,
	stepsSummary: '',
	personalizedSteps: '',
	// steps: [],
	steps: [
		{
			step_title: 'Install Trigger.dev SDK and Next.js Library',
			step_description:
				"To integrate Trigger.dev with your Next.js project, you'll need to install the SDK and Next.js integration libraries using bun, your project's package manager.",
			step_type: 'RUN_BASH_COMMAND',
			bash_command_to_run: 'bun add @trigger.dev/sdk @trigger.dev/nextjs',
		},
		{
			step_title: 'Obtain Development API Key',
			step_description:
				'Obtain the development API key from the Trigger.dev dashboard to authenticate your application with the Trigger.dev services.',
			step_type: 'USER_ACTION',
			user_action: {
				url: 'https://cloud.trigger.dev/',
			},
		},
		{
			step_title: 'Create Environment Variables File',
			step_description:
				'Create a file to store environment variables, which will include your Trigger.dev API key for secure access within your application.',
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './.env.local',
				file_extension: 'env',
				file_content_summary:
					'This file stores environment variables such as the Trigger.dev API key and URL required for the Trigger client configuration.',
				file_code_changes: 'TRIGGER_API_KEY=your_development_api_key_here',
			},
		},
		{
			step_title: 'Create Trigger Client Configuration',
			step_description:
				"This step involves creating a new TypeScript file in your 'src' directory to hold the configuration for the Trigger.dev client. This allows your application to interact with the Trigger.dev services.",
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/trigger.ts',
				file_extension: 'ts',
				file_content_summary:
					'Configuration file for the Trigger.dev client, specifying the project identifier, API key, and API URL.',
				file_code_changes:
					"import { TriggerClient } from '@trigger.dev/sdk'; export const client = new TriggerClient({ id: 'my-app', // Replace with an appropriate identifier for your project apiKey: process.env.TRIGGER_API_KEY, apiUrl: process.env.TRIGGER_API_URL });",
			},
		},
		{
			step_title: 'Create Trigger API Route',
			step_description:
				"In this step, you'll create a new API route that will handle Trigger.dev events. This route is essential for initializing and connecting your backend to the Trigger.dev client.",
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/pages/api/trigger.ts',
				file_extension: 'ts',
				file_content_summary:
					'API route that initializes and connects to the Trigger.dev client, enabling the invocation of backend jobs.',
				file_code_changes:
					"import { createPagesRoute } from '@trigger.dev/nextjs'; import { client } from '../../trigger'; import '../../jobs'; const { handler, config } = createPagesRoute(client); export { config }; export default handler;",
			},
		},
		{
			step_title: 'Define Example Job',
			step_description:
				'Setting up an example job will give you a quick start in understanding how to define jobs that can be triggered by events in your application. The example provided should be customized to suit the actual tasks you want to run.',
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/jobs/example.ts',
				file_extension: 'ts',
				file_content_summary:
					'This TypeScript file contains an example job definition using the Trigger.dev SDK, which can be triggered by a specific event.',
				file_code_changes:
					"import { eventTrigger } from '@trigger.dev/sdk'; import { client } from '../trigger'; client.defineJob({ id: 'example-job', name: 'Example Job', version: '0.0.1', trigger: eventTrigger({ name: 'example.event', }), run: async (payload, io, ctx) => { await io.logger.info('Hello world!', { payload }); return { message: 'Hello world!', }; }, });",
			},
		},
		{
			step_title: 'Export Job Definitions',
			step_description:
				'This file acts as an index that exports all job definitions, ensuring they are centrally managed and accessible throughout your application. You can add additional job exports here as you create more jobs.',
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/jobs/index.ts',
				file_extension: 'ts',
				file_content_summary:
					'Central index file for exporting job definitions for easy management and access within the application.',
				file_code_changes: "export * from './example';",
			},
		},
		{
			step_title: 'Configure package.json for Trigger.dev',
			step_description:
				'Add a specific configuration to your package.json file that identifies your Trigger.dev endpoint. This allows Trigger.dev to recognize your application and route jobs correctly.',
			step_type: 'MODIFY_FILE',
			existing_file_path_to_modify: {
				file_path: './package.json',
				file_extension: 'json',
				current_file_content_summary:
					'Node.js project using Next.js and TypeScript, with dependencies including Prisma for database, React and React DOM for UI, Zod for data validation, and Trigger.dev for triggering events.',
				file_content_summary:
					"The modified package.json now includes a Trigger.dev configuration object specifying your application's endpoint identifier. This is used by Trigger.dev to link events to your specific deployment.",
			},
		},
		{
			step_title: 'Run the Development Server and Trigger.dev CLI',
			step_description:
				'Launch your Next.js application using the bun package manager to serve the frontend, and start the Trigger.dev CLI in a separate terminal window to handle job execution.',
			step_type: 'USER_ACTION',
			user_action: {
				bash_command: 'bun run dev',
			},
		},
		{
			step_title: 'Run the Trigger.dev CLI',
			step_description:
				"In a new terminal window, you'll need to start the Trigger.dev CLI. This tool will manage the execution of jobs and trigger events within your application environment.",
			step_type: 'USER_ACTION',
			user_action: {
				bash_command: 'bunx @trigger.dev/cli@latest dev',
			},
		},
	],
	activeStepIndex: 0,
	activeStepActor: undefined,

	isStepsSummaryLoading: false,
	isStepsSummarySuccess: true,
	isStepsSummaryError: false,

	isPersonalizingStepsLoading: false,
	isPersonalizingStepsSuccess: true,
	isPersonalizingStepsError: false,

	isGeneratingStepsLoading: false,
	isGeneratingStepsSuccess: true,
	isGeneratingStepsError: false,
};

export const stepsMachine = createMachine<
	StepsMachineContext,
	StepsMachineEvent,
	StepsMachineState
>({
	id: 'stepsMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	initial: StepsState.REVIEW_STEPS_IDLE,
	context: initialStepsMachineContext,
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
			entry: assign({isStepsSummaryLoading: true}),
			invoke: {
				src: context => {
					const projectSummary = context.repositoryMap?.find(
						fileMapItem => fileMapItem.filePath === 'package.json',
					)?.fileSummary;

					return sendQueryMachine.withContext({
						...initialSendQueryMachineContext,
						query: `package.json summary: ${projectSummary}
Package manager: ${context.repositoryConfig?.packageManager}.
Question: Given this information, how do I manually setup 'trigger.dev' in my project? (Respond with numbered steps. Respond with appropriate code or commands if present in the documentation.)`,
						skipTransform: true,
					});
				},
				onDone: {
					target: StepsState.PERSONALIZING_STEPS_SUMMARY,
					actions: [
						assign(
							(_, event: DoneInvokeEvent<SendQueryMachineResult<string>>) => ({
								stepsSummary: event.data.result,
								run: event.data.run,
								isStepsSummarySuccess: true,
							}),
						),
					],
				},
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log('generate steps summary error: ', event.data),
				},
			},
			exit: assign({isStepsSummaryLoading: false}),
		},
		[StepsState.PERSONALIZING_STEPS_SUMMARY]: {
			entry: assign({isPersonalizingStepsLoading: true}),
			invoke: {
				src: context =>
					sendQueryMachine.withContext({
						...initialSendQueryMachineContext,
						query: `Here is an overview of my project showing the location and the purpose of each file: ${JSON.stringify(
							context.repositoryMap,
						)}
Question: How do I apply these steps to my project? From the project map, you should infer the appropriate files to create and modify when necessary. ALWAYS infer appropriate variable names, types and import paths where necessary. Each step should be atomic.`,
						thread_id: context.run?.thread_id,
						skipTransform: true,
					}),
				onDone: {
					target: StepsState.GENERATING_STEPS,
					actions: [
						assign(
							(_, event: DoneInvokeEvent<SendQueryMachineResult<string>>) => ({
								isPersonalizingStepsSuccess: true,
								personalizedSteps: event.data.result,
								run: event.data.run,
							}),
						),
					],
				},
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log('personalizing steps error: ', event.data),
				},
			},
			exit: assign({isPersonalizingStepsLoading: false}),
		},
		[StepsState.GENERATING_STEPS]: {
			entry: assign({isGeneratingStepsLoading: true}),
			invoke: {
				src: context =>
					sendQueryMachine.withContext({
						...initialSendQueryMachineContext,
						query: `Classify these steps into the following JSON schema: ${JSON.stringify(
							StepsSchema,
						)}
Skip steps where I should create a folder. No preamble, respond with JSON only.`,
						thread_id: context.run?.thread_id,
						responseParentKey: 'steps',
					}),
				onDone: {
					target: StepsState.REVIEW_STEPS_IDLE,
					actions: [
						assign(
							(
								_,
								event: DoneInvokeEvent<SendQueryMachineResult<{steps: Step[]}>>,
							) => ({
								isGeneratingStepsSuccess: true,
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
			exit: assign({isGeneratingStepsLoading: false}),
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
									...initialCreateFileMachineContext,
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
				{
					cond: isUserAction,
					target: StepsState.ACTIVE_STEP_IDLE,
					actions: assign({
						activeStepActor: context =>
							spawn(
								userActionMachine.withContext({
									...initialUserActionContext,
									user_action:
										context.steps?.[context.activeStepIndex]?.user_action,
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
		[StepsState.STEPS_COMPLETE]: {
			type: 'final',
		},
	},
});
