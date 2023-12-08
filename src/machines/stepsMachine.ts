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
	FETCHING_PREV_STEP = 'FETCHING_PREV_STEP',
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
	| {value: StepsState.FETCHING_PREV_STEP; context: StepsMachineContext}
	| {value: StepsState.STEPS_COMPLETE; context: StepsMachineContext};

//  State machine events
export type StepsMachineEvent =
	| {type: StepsEvent.NAVIGATE_NEXT_STEP}
	| {type: StepsEvent.NAVIGATE_PREV_STEP}
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
			step_title: 'Install Trigger.dev SDK',
			step_description:
				'This step involves adding the Trigger.dev SDK to your project dependencies, which is a crucial package that allows you to interact with the Trigger.dev API within your application.',
			step_type: 'RUN_BASH_COMMAND',
			bash_command_to_run: 'npm install @trigger.dev/sdk',
		},
		{
			step_title: 'Install Trigger.dev Next.js Integration',
			step_description:
				"By installing the Trigger.dev integration package for Next.js, you're setting up the necessary hooks and middleware to work seamlessly with Trigger.dev within the context of a Next.js application.",
			step_type: 'RUN_BASH_COMMAND',
			bash_command_to_run: 'npm install @trigger.dev/nextjs',
		},
		{
			step_title: 'Set up Environment Variables',
			step_description:
				'Environment variables are used to securely store sensitive information such as API keys. They are also a way to configure behavior of your application without hardcoding values directly into your codebase.',
			step_type: 'MODIFY_FILE',
			existing_file_path_to_modify: {
				file_path: './.env.local',
				file_extension: 'env',
				current_file_content_summary:
					'Environment configuration file that stores private variables such as API keys and other sensitive details, which should not be committed to version control.',
				file_content_summary:
					'This file will contain the Trigger.dev API key and URL required to initialize and authenticate with the Trigger.dev API.',
			},
		},
		{
			step_title: 'Create Trigger Client Configuration',
			step_description:
				'This TypeScript file exports an instance of TriggerClient, configured with your project ID and API credentials sourced from environment variables, establishing the connection between your application and Trigger.dev services.',
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/triggerClient.ts',
				file_extension: 'ts',
				file_content_summary:
					'This TypeScript file exports an instance of TriggerClient, configured with your project ID and API credentials sourced from environment variables, establishing the connection between your application and Trigger.dev services.',
				file_code_changes:
					'import { TriggerClient } from "@trigger.dev/sdk";\n\nexport const triggerClient = new TriggerClient({\n  id: "your-project-identifier",\n  apiKey: process.env.TRIGGER_API_KEY,\n  apiUrl: process.env.TRIGGER_API_URL,\n});',
			},
		},
		{
			step_title: 'Define Trigger Job',
			step_description:
				'This step defines a new job for Trigger.dev in your application. Jobs are the units of work that Trigger.dev will execute based on events or schedules you define.',
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/jobs/exampleJob.ts',
				file_extension: 'ts',
				file_content_summary:
					'This TypeScript file contains the definition of a job that responds to a specific event trigger, it describes how the job should behave and the actions it should perform when triggered.',
				file_code_changes:
					'import { eventTrigger } from "@trigger.dev/sdk"\nimport { triggerClient } from "../triggerClient"\n\ntriggerClient.defineJob({\n  id: "example-job",\n  name: "Example Job",\n  version: "0.0.1",\n  trigger: eventTrigger({\n    name: "example.event",\n  }),\n  run: async (payload, io, ctx) => {\n    await io.logger.info("Hello world!", { payload });\n\n    return {\n      message: "Hello world!",\n    };\n  },\n});',
			},
		},
		{
			step_title: 'Export Trigger Jobs',
			step_description:
				'This file serves as an entry point to export all defined Trigger.dev jobs within the directory so that they can be easily imported and registered in your application.',
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/jobs/index.ts',
				file_extension: 'ts',
				file_content_summary:
					'Collects and exports trigger job definitions from individual job files, organizing the jobs to register them as a batch within your Trigger.dev client.',
				file_code_changes: 'export * from "./exampleJob";',
			},
		},
		{
			step_title: 'Create Trigger API Route',
			step_description:
				"API routes in Next.js act as the backend of your application. In this step, you're creating an API route that the Trigger.dev SDK can use to communicate with your job definitions.",
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/pages/api/trigger.ts',
				file_extension: 'ts',
				file_content_summary:
					'This API route is tied to Trigger.dev, it listens for incoming job execution requests and passes them to the appropriate job handlers defined in your Next.js application.',
				file_code_changes:
					'import { createPagesRoute } from "@trigger.dev/nextjs";\nimport { triggerClient } from "../../triggerClient";\nimport "../../jobs";\n\nconst { handler, config } = createPagesRoute(triggerClient);\nexport { config };\nexport default handler;',
			},
		},
		{
			step_title: 'Update Package Configuration',
			step_description:
				"The package.json file in a Node.js project includes not only your project's dependency list, but also various configurations for tools and libraries. By adding Trigger.dev's configuration, you are providing necessary information for the Trigger.dev CLI to interface correctly with your application.",
			step_type: 'MODIFY_FILE',
			existing_file_path_to_modify: {
				file_path: './package.json',
				file_extension: 'json',
				current_file_content_summary:
					'This project is a Next.js application using TypeScript and Tailwind CSS. It includes dependencies like React, Next.js, TypeScript, Tailwind CSS, ESLint, and more for development.',
				file_content_summary:
					"Enhanced to include configuration for Trigger.dev, specifying your app's unique endpointId to connect with the Trigger.dev backend services.",
			},
		},
		{
			step_title: 'Run Next.js Development Server',
			step_description:
				'Starting the Next.js development server is essential for testing your local project in real-time, including the features you have integrated with Trigger.dev.',
			step_type: 'USER_ACTION',
			user_action: {
				bash_command: 'npm run dev',
			},
		},
		{
			step_title: 'Run Trigger.dev CLI',
			step_description:
				"The Trigger.dev CLI provides a command-line interface to work with Trigger.dev. Running it in tandem with your application's development server allows you to manage and test triggers locally.",
			step_type: 'USER_ACTION',
			user_action: {
				bash_command: 'npx @trigger.dev/cli@latest dev',
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
Question: How do I apply these steps to my project? From the project map, you should infer the appropriate files to create and modify when necessary. In the code files, try to infer appropriate variable names, types and import paths where necessary. If the project uses typescript, assume strict mode is active. Do not omit any step. Each step should be atomic.`,
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
