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
			step_title: 'Install trigger.dev packages',
			step_description:
				'You need to add the trigger.dev SDK and server-side middleware to your project. These packages enable you to define and handle custom jobs triggered by various events within your application.',
			step_type: 'RUN_BASH_COMMAND',
			bash_command_to_run: 'npm install @trigger.dev/sdk @trigger.dev/express',
		},
		{
			step_title: 'Copy API key from dashboard',
			step_description:
				'Retrieve the Server API key from the trigger.dev dashboard. This key is essential for your server to authenticate and communicate with the trigger.dev services.',
			step_type: 'USER_ACTION',
			user_action: {
				url: 'https://cloud.trigger.dev/dashboard',
			},
		},
		{
			step_title: 'Configure environment variables',
			step_description:
				"Environment variables are crucial for storing sensitive information such as API keys outside your codebase. You'll need to set up the trigger.dev API key in your project's environment variables.",
			step_type: 'MODIFY_FILE',
			existing_file_path_to_modify: {
				file_path: './.env',
				file_extension: 'env',
				current_file_content_summary:
					'This file serves as an example for the ".env" file, providing instructions for building a new ".env" file when cloning the repository.',
				file_content_summary:
					'Adds necessary trigger.dev configurations: your unique Server API key for secure interaction between your app and trigger.dev services, and specifies the API URL.',
			},
		},
		{
			step_title: 'Create Trigger client configuration',
			step_description:
				"To interact with trigger.dev, you need to configure the TriggerClient. This setup includes providing your app's unique identifier and specifying the API key for authentication.",
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/trigger.ts',
				file_extension: 'ts',
				file_content_summary:
					'This file initializes the Trigger client with your project-specific ID and the environment variables containing the API key and URL.',
				file_code_changes:
					'import { TriggerClient } from "@trigger.dev/sdk";\n\nexport const client = new TriggerClient({\n  id: "my-nextjs-app",\n  apiKey: process.env.TRIGGER_API_KEY!,\n  apiUrl: process.env.TRIGGER_API_URL!,\n});',
			},
		},
		{
			step_title: 'Set up Express to use trigger.dev middleware',
			step_description:
				"For trigger.dev to handle the background jobs, you need to integrate its Express middleware into your Next.js API routes, enabling job processing within your application's server side.",
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/pages/api/trigger.ts',
				file_extension: 'ts',
				file_content_summary:
					'This file sets up an Express application using the trigger.dev middleware to handle jobs dispatched by trigger.dev within the Next.js API routes.',
				file_code_changes:
					'import type { NextApiRequest, NextApiResponse } from \'next\';\nimport express from \'express\';\nimport { createMiddleware } from "@trigger.dev/express";\nimport { client } from "../../trigger";\n\nconst app = express();\napp.use(createMiddleware(client));\n\nexport default (req: NextApiRequest, res: NextApiResponse) => {\n    app(req, res, (result) => {\n        if (result instanceof Error) {\n            throw result;\n        }\n        res.status(result.statusCode).end();\n    });\n};',
			},
		},
		{
			step_title: 'Define a job for trigger.dev',
			step_description:
				"Jobs are the core of trigger.dev's functionality. They represent tasks that your application can run in response to events. You'll need to define these jobs so that trigger.dev knows what actions to execute.",
			step_type: 'CREATE_FILE',
			new_file_path_to_create: {
				file_path: './src/jobs/exampleJob.ts',
				file_extension: 'ts',
				file_content_summary:
					'This job file creates a job definition for trigger.dev, setting up the event trigger and defining what the job does when the event occurs.',
				file_code_changes:
					'import { eventTrigger } from "@trigger.dev/sdk";\nimport { client } from "../trigger";\n\nclient.defineJob({\n  id: "example-job",\n  name: "Example Job",\n  version: "0.0.1",\n  trigger: eventTrigger({\n    name: "example.event",\n  }),\n  run: async (payload, io, ctx) => {\n    await io.logger.info("Hello world!", { payload });\n\n    return {\n      message: "Hello world!",\n    };\n  },\n});',
			},
		},
		{
			step_title: 'Add trigger.dev configuration to package.json',
			step_description:
				'The package.json helps trigger.dev CLI identify your project. By adding the endpointId, the CLI can correctly target and handle job processing for your application.',
			step_type: 'MODIFY_FILE',
			existing_file_path_to_modify: {
				file_path: './package.json',
				file_extension: 'json',
				current_file_content_summary:
					'This is a package.json file for a project using Next.js, Prisma, React, and TypeScript, with dependencies for data fetching, API interaction, and type validation.',
				file_content_summary:
					'Configures the package.json file for trigger.dev CLI, providing it with the unique endpoint identifier for the Trigger client.',
			},
		},
		{
			step_title: 'Run development server',
			step_description:
				"To test the integration with trigger.dev, you'll need to run your Next.js application in development mode. This allows you to make sure everything is wired up correctly and functioning as intended.",
			step_type: 'USER_ACTION',
			user_action: {
				bash_command: 'npm run dev',
			},
		},
		{
			step_title: 'Start trigger.dev CLI tool',
			step_description:
				'The trigger.dev CLI tool is the bridge between your local development environment and trigger.dev services. Running the CLI allows you to develop and test your trigger.dev jobs in real time.',
			step_type: 'USER_ACTION',
			user_action: {
				bash_command: 'npx @trigger.dev/cli@latest dev',
			},
		},
	],
	activeStepIndex: 6,
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
	initial: StepsState.STEPS_COMPLETE,
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
