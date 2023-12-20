import {assign, createMachine, spawn, type DoneInvokeEvent} from 'xstate';
import {submitToolOutputs} from '../utils/api/submitToolOutputs.js';
import {
	ToolState,
	ToolEvent,
	ToolAction,
	type ToolMachineEvent,
	type ToolMachineContext,
	type ToolMachineState,
	type ToolItem,
} from '../types/ToolMachine.js';
import {getLibrary} from '../utils/api/getLibrary.js';
import {type Library} from '../types/Library.js';
import {
	initialRunCommandToolMachineContext,
	runCommandToolMachine,
} from './tools/runCommandToolMachine.js';

import {
	type EditFileToolArguments,
	type CreateFileToolArguments,
	type RunCommandToolArguments,
	type UserSelectToolArguments,
	type ReadFileToolArguments,
	type FindFileByPathToolArguments,
	type UserInputTooArguments,
} from '../types/ToolArguments.js';
import {
	createFileToolMachine,
	initialCreateFileToolMachineContext,
} from './tools/createFileToolMachine.js';
import {
	editFileToolMachine,
	initialEditFileToolMachineContext,
} from './tools/editFileToolMachine.js';
import {getQueryStatus} from '../utils/api/getQueryStatus.js';
import {type RunStatusResponse} from '../types/Run.js';
import {type Tool} from '../types/Tool.js';

import {
	initialReadFileToolMachineContext,
	readFileToolMachine,
} from './tools/readFileToolMachine.js';
import {
	findFileByPathToolMachine,
	initialFindFileByPathToolMachineContext,
} from './tools/findFileByPathToolMachine.js';
import {
	initialUserInputToolMachineContext,
	userInputToolMachine,
} from './tools/userInputToolMachine.js';
import {
	initialSendCommandMachineContext,
	sendCommandMachine,
} from './sendCommandMachine.js';
import {
	initialUserSelectToolMachineContext,
	userSelectToolMachine,
} from './tools/userSelectToolMachine.js';

// Context
export const initialToolMachineContext: ToolMachineContext = {
	libraryName: '',
	libraryCommand: '',
	library: undefined,

	showSendCommand: false,
	sendCommandActorRef: undefined,

	// run: {
	// 	run_id: 'run_BVvq4e0tye7VuQgUvRLZruzG',
	// 	thread_id: 'thread_6DylXOW0sBIObr7Fe2vOU4qs',
	// },

	run: undefined,
	tools: [],
	// tools: [
	// {
	// 	id: 'call_Rf0OjdJIhskTFyF4kcvV2SPv',
	// 	name: 'run_command',
	// 	type: 'function',
	// 	status: 'pending',
	// 	arguments: {
	// 		title: 'Installing Required Packages',
	// 		description:
	// 			'Choose the appropriate package manager and execute the command within your Next.js project directory.',
	// 		command: 'npm install @trigger.dev/sdk @trigger.dev/nextjs',
	// 	},
	// },
	//  {
	//   id: "call_Rf0OjdJIhskTFyF4kcvV2SPv",
	//   type: "function",
	//   function: {
	//     name: "run_command",
	//     arguments: "{\"title\":\"Installing Required Packages\",\"description\":\"Choose the appropriate package manager and execute the command within your Next.js project directory.\",\"command\":\"npm install @trigger.dev/sdk @trigger.dev/nextjs\"}"
	//   }
	// }
	// {
	// 	id: 'call_qN1AlqnExfp8dUZISsx4VSi5',
	// 	name: 'read_file',
	// 	type: 'function',
	// 	status: 'pending',
	// 	arguments: {
	// 		reason: 'Checking dependencies',
	// 		file_path: './package.json',
	// 	},
	// },
	// {
	// 	id: 'call_q324n1lk2e12klmfewExfp8dUZISsxfewfwe',
	// 	name: 'user_select',
	// 	type: 'function',
	// 	status: 'pending',
	// 	arguments: {
	// 		title: 'Select Package Manager',
	// 		question:
	// 			'Which package manager do you want to use for installing the required packages in your Next.js project?',
	// 		options: ['npm', 'pnpm', 'yarn', 'bun'],
	// 	},
	// },
	// 	{
	// 		id: 'call_nfjkewbfiuen23o43209uvfdsno',
	// 		name: 'find_file_by_path',
	// 		type: 'function',
	// 		status: 'pending',
	// 		arguments: {
	// 			file_path: './env.local',
	// 		},
	// 	},
	// 	{
	// 		id: 'call_r32krldmfcewnfioepwjfmeklm12',
	// 		name: 'user_input',
	// 		type: 'function',
	// 		status: 'pending',
	// 		arguments: {
	// 			title: 'Name',
	// 			question: 'What is your first name?',
	// 			placeholder: 'James',
	// 		},
	// 	},
	// 	// {
	// 	// 	id: 'call_6TAdGAVYnMQmTTkpeEERNOVg',
	// 	// 	name: 'create_file',
	// 	// 	type: 'function',
	// 	// 	status: 'pending',
	// 	// 	arguments: {
	// 	// 		title: 'Create an example job',
	// 	// 		description: 'This is an example job.',
	// 	// 		file_path: './src/Jobs/example.ts',
	// 	// 		file_extension: 'ts',
	// 	// 		file_content:
	// 	// 			'import { eventTrigger } from "@trigger.dev/sdk"\nimport { client } from "@/trigger" // Replace "@/trigger" with the relative path to your Trigger Client configuration file\n\nclient.defineJob({\n  id: "example-job",\n  name: "Example Job",\n  version: "0.0.1",\n  trigger: eventTrigger({\n    name: "example.event",\n  }),\n  run: async (payload, io, ctx) => {\n    await io.logger.info("Hello world!", { payload })\n\n    return {\n      message: "Hello world!",\n    }\n  },\n})',
	// 	// 	},
	// 	// },
	// 	// 		{
	// 	// 			id: 'call_cJGsZ9M4X6jOZPw28BOnhO7T',
	// 	// 			name: 'edit_file',
	// 	// 			type: 'function',
	// 	// 			status: 'pending',
	// 	// 			arguments: {
	// 	// 				file_path: './package.json',
	// 	// 				file_extension: 'json',
	// 	// 				file_content: `{
	// 	//   "name": "ragdoll",
	// 	//   "version": "0.1.0",
	// 	//   "private": true,
	// 	//   "scripts": {
	// 	//     "build": "next build",
	// 	//     "db:push": "prisma db push",
	// 	//     "db:studio": "prisma studio",
	// 	//     "dev": "next dev",
	// 	//     "postinstall": "prisma generate",
	// 	//     "lint": "next lint",
	// 	//     "start": "next start"
	// 	//   },
	// 	//   "dependencies": {
	// 	//     "@prisma/client": "^5.1.1",
	// 	//     "@t3-oss/env-nextjs": "^0.7.0",
	// 	//     "@tanstack/react-query": "^4.32.6",
	// 	//     "@trpc/client": "^10.37.1",
	// 	//     "@trpc/next": "^10.37.1",
	// 	//     "@trpc/react-query": "^10.37.1",
	// 	//     "@trpc/server": "^10.37.1",
	// 	//     "next": "^13.5.4",
	// 	//     "react": "18.2.0",
	// 	//     "react-dom": "18.2.0",
	// 	//     "superjson": "^1.13.1",
	// 	//     "zod": "^3.22.4"
	// 	//   },
	// 	//   "devDependencies": {
	// 	//     "@types/eslint": "^8.44.2",
	// 	//     "@types/node": "^18.16.0",
	// 	//     "@types/react": "^18.2.20",
	// 	//     "@types/react-dom": "^18.2.7",
	// 	//     "@typescript-eslint/eslint-plugin": "^6.3.0",
	// 	//     "@typescript-eslint/parser": "^6.3.0",
	// 	//     "eslint": "^8.47.0",
	// 	//     "eslint-config-next": "^13.5.4",
	// 	//     "prisma": "^5.1.1",
	// 	//     "typescript": "^5.1.6"
	// 	//   },
	// 	//   "ct3aMetadata": {
	// 	//     "initVersion": "7.22.0"
	// 	//   },
	// 	//   "triggerEndpoint": "https://api.trigger.dev"
	// 	// }`,
	// 	// 			},
	// 	// 		},
	// ],
	toolRefs: {},
	toolOutputs: [],

	isLoading: false,
	isError: false,
	errorMessage: '',
};

// Guards
const isPendingTools = (context: ToolMachineContext) =>
	context.tools.some(tool => tool.status === 'pending');

// Utils
const getActiveTool = (context: ToolMachineContext) =>
	context.tools.find(tool => tool.status === 'active');

const getPendingToolsFromCalls = (tools: Tool[]): ToolItem[] => {
	return tools.map(tool => ({
		id: tool.id,
		name: tool.function.name,
		type: tool.type,
		status: 'pending',
		arguments: JSON.parse(tool.function.arguments),
	}));
};

const activatePendingTool = async (
	context: ToolMachineContext,
): Promise<ToolItem[]> => {
	return new Promise(resolve => {
		const pendingTools = context.tools.filter(
			tool => tool.status === 'pending',
		);

		if (pendingTools[0]) {
			console.log('Pending tool FOUND');
			pendingTools[0].status = 'active';
			resolve(context.tools);
		} else {
			console.log('Pending tool NOT FOUND');
			throw new Error('No pending tools found');
		}
	});
};

export const toolMachine = createMachine<
	ToolMachineContext,
	ToolMachineEvent,
	ToolMachineState
>(
	{
		id: 'toolMachine',
		predictableActionArguments: true,
		preserveActionOrder: true,
		context: initialToolMachineContext,
		initial: ToolState.FETCHING_LIBRARY,
		states: {
			[ToolState.FETCHING_LIBRARY]: {
				invoke: {
					src: async context => await getLibrary({name: context.libraryName}),
					onDone: {
						target: ToolState.SENDING_COMMAND,
						actions: assign({
							library: (_, event: DoneInvokeEvent<Library>) => event.data,
						}),
					},
					onError: {actions: [ToolAction.SET_ERROR_MESSAGE]},
				},
			},
			[ToolState.SENDING_COMMAND]: {
				entry: [
					assign({
						showSendCommand: true,
						sendCommandActorRef: context =>
							spawn(
								sendCommandMachine.withContext({
									...initialSendCommandMachineContext,
									libraryName: context.libraryName,
									libraryCommand: context.libraryCommand,
								}),
							),
					}),
				],
				on: {
					[ToolEvent.SEND_COMMAND_UPDATE_TOOLS]: {
						target: ToolState.ACTIVATING_PENDING_TOOL,
						actions: assign({
							run: (_, event) => event.result.run,
							tools: (context, event) => {
								const pendingTools = getPendingToolsFromCalls(
									event.result.tools,
								);
								return [...context.tools, ...pendingTools];
							},
						}),
					},
				},
			},
			[ToolState.POLLING_RUN]: {
				entry: [assign({isLoading: true})],
				invoke: {
					src: async context => {
						if (!context.run) {
							throw new Error('Run is missing from context');
						}
						return await getQueryStatus({...context.run});
					},
					onDone: [
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'queued',
							target: ToolState.POLLING_RUN,
						},
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'in_progress',
							target: ToolState.POLLING_RUN,
						},
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'requires_action',
							actions: assign({
								tools: (
									context,
									event: DoneInvokeEvent<RunStatusResponse>,
								): ToolItem[] => {
									const pendingTools = getPendingToolsFromCalls(
										event.data.required_action.submit_tool_outputs.tool_calls,
									);
									return [...context.tools, ...pendingTools];
								},
							}),
							target: ToolState.ACTIVATING_PENDING_TOOL,
						},
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'completed',
							actions: assign({errorMessage: 'Invalid response format'}),
							target: ToolState.ERROR_IDLE,
						},
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'failed',
							actions: assign({errorMessage: 'Invalid response format'}),
							target: ToolState.ERROR_IDLE,
						},
					],
					onError: {actions: [ToolAction.SET_ERROR_MESSAGE]},
				},
				exit: [assign({isLoading: false})],
			},
			[ToolState.ACTIVATING_PENDING_TOOL]: {
				invoke: {
					src: async context => await activatePendingTool(context),
					onDone: {
						target: ToolState.SPAWNING_ACTIVE_TOOL_ACTOR,
						actions: assign({
							tools: (_, event: DoneInvokeEvent<ToolItem[]>) => event.data,
						}),
					},
					onError: {
						target: ToolState.SUBMITTING_TOOL_OUTPUTS,
					},
				},
			},
			[ToolState.SPAWNING_ACTIVE_TOOL_ACTOR]: {
				always: [
					{
						cond: context => getActiveTool(context)?.name === 'run_command',
						actions: [
							assign({
								toolRefs: context => {
									const activeTool = getActiveTool(context);
									if (!activeTool) {
										throw new Error('Active tool not found');
									}
									const activeToolArguments =
										activeTool.arguments as RunCommandToolArguments;

									const activeToolRef = spawn(
										runCommandToolMachine.withContext({
											...initialRunCommandToolMachineContext,
											command: activeToolArguments.command,
										}),
									);

									return {...context.toolRefs, [activeTool.id]: activeToolRef};
								},
							}),
						],
						target: ToolState.PROCESSING_ACTIVE_TOOL,
					},
					{
						cond: context => getActiveTool(context)?.name === 'create_file',
						actions: [
							assign({
								toolRefs: context => {
									const activeTool = getActiveTool(context);
									if (!activeTool) {
										throw new Error('Active tool not found');
									}
									const activeToolArguments =
										activeTool.arguments as CreateFileToolArguments;

									const activeToolRef = spawn(
										createFileToolMachine.withContext({
											...initialCreateFileToolMachineContext,
											filePath: activeToolArguments.file_path,
											fileExtension: activeToolArguments.file_extension,
											fileContent: activeToolArguments.file_content,
										}),
									);

									return {...context.toolRefs, [activeTool.id]: activeToolRef};
								},
							}),
						],
						target: ToolState.PROCESSING_ACTIVE_TOOL,
					},
					{
						cond: context => getActiveTool(context)?.name === 'edit_file',
						actions: [
							assign({
								toolRefs: context => {
									const activeTool = getActiveTool(context);
									if (!activeTool) {
										throw new Error('Active tool not found');
									}
									const activeToolArguments =
										activeTool.arguments as EditFileToolArguments;

									const activeToolRef = spawn(
										editFileToolMachine.withContext({
											...initialEditFileToolMachineContext,
											filePath: activeToolArguments.file_path,
											fileExtension: activeToolArguments.file_extension,
											fileContent: activeToolArguments.file_content,
										}),
									);

									return {...context.toolRefs, [activeTool.id]: activeToolRef};
								},
							}),
						],
						target: ToolState.PROCESSING_ACTIVE_TOOL,
					},
					{
						cond: context => getActiveTool(context)?.name === 'user_select',
						actions: [
							assign({
								toolRefs: context => {
									const activeTool = getActiveTool(context);
									if (!activeTool) {
										throw new Error('Active tool not found');
									}
									const activeToolArguments =
										activeTool.arguments as UserSelectToolArguments;

									const activeToolRef = spawn(
										userSelectToolMachine.withContext({
											...initialUserSelectToolMachineContext,
											options: activeToolArguments.options,
										}),
									);

									return {...context.toolRefs, [activeTool.id]: activeToolRef};
								},
							}),
						],
						target: ToolState.PROCESSING_ACTIVE_TOOL,
					},
					{
						cond: context => getActiveTool(context)?.name === 'read_file',
						actions: [
							assign({
								toolRefs: context => {
									const activeTool = getActiveTool(context);
									if (!activeTool) {
										throw new Error('Active tool not found');
									}
									const activeToolArguments =
										activeTool.arguments as ReadFileToolArguments;

									const activeToolRef = spawn(
										readFileToolMachine.withContext({
											...initialReadFileToolMachineContext,
											filePath: activeToolArguments.file_path,
										}),
									);

									return {...context.toolRefs, [activeTool.id]: activeToolRef};
								},
							}),
						],
						target: ToolState.PROCESSING_ACTIVE_TOOL,
					},
					{
						cond: context =>
							getActiveTool(context)?.name === 'find_file_by_path',
						actions: [
							assign({
								toolRefs: context => {
									const activeTool = getActiveTool(context);
									if (!activeTool) {
										throw new Error('Active tool not found');
									}
									const activeToolArguments =
										activeTool.arguments as FindFileByPathToolArguments;

									const activeToolRef = spawn(
										findFileByPathToolMachine.withContext({
											...initialFindFileByPathToolMachineContext,
											filePath: activeToolArguments.file_path,
										}),
									);

									return {...context.toolRefs, [activeTool.id]: activeToolRef};
								},
							}),
						],
						target: ToolState.PROCESSING_ACTIVE_TOOL,
					},
					{
						cond: context => getActiveTool(context)?.name === 'user_input',
						actions: [
							assign({
								toolRefs: context => {
									const activeTool = getActiveTool(context);
									if (!activeTool) {
										throw new Error('Active tool not found');
									}
									const activeToolArguments =
										activeTool.arguments as UserInputTooArguments;

									const activeToolRef = spawn(
										userInputToolMachine.withContext({
											...initialUserInputToolMachineContext,
										}),
									);

									return {...context.toolRefs, [activeTool.id]: activeToolRef};
								},
							}),
						],
						target: ToolState.PROCESSING_ACTIVE_TOOL,
					},
				],
			},
			[ToolState.PROCESSING_ACTIVE_TOOL]: {
				on: {
					[ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT]: {
						actions: [
							assign({
								toolOutputs: (context, event) => {
									console.log('🌱 # event:', event);
									const activeTool = getActiveTool(context);
									if (!activeTool) {
										throw new Error('active tool not found');
									}
									const result = {
										tool_call_id: activeTool.id,
										output: event.output,
									};
									return [...context.toolOutputs, result];
								},
								tools: context => {
									const activeTool = getActiveTool(context);

									if (!activeTool) {
										throw new Error('active tool not found');
									}
									activeTool.status = 'completed';
									return context.tools;
								},
							}),
						],
						target: ToolState.ACTIVATING_PENDING_TOOL,
					},
				},
			},
			[ToolState.SUBMITTING_TOOL_OUTPUTS]: {
				invoke: {
					src: async context => {
						const {run, toolOutputs} = context;
						if (!run) {
							throw new Error('Run details are missing from the context.');
						}
						await submitToolOutputs({run, toolOutputs});
					},
					onDone: {
						actions: assign({toolOutputs: []}),
						target: ToolState.POLLING_RUN,
					},
					onError: {
						target: ToolState.ERROR_IDLE,
						actions: [ToolAction.SET_ERROR_MESSAGE],
					},
				},
			},
			[ToolState.SUCCESS_IDLE]: {},
			[ToolState.ERROR_IDLE]: {
				entry: [assign({isError: true})],

				exit: [assign({isError: false})],
			},
		},
	},
	{
		actions: {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			[ToolAction.SET_ERROR_MESSAGE]: assign({
				errorMessage: (_, event: DoneInvokeEvent<Error>) => event.data.message,
			}),
		},
	},
);
