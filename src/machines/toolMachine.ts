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
	type UserActionToolArguments,
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
import {
	initialUserActionToolContext,
	userActionToolMachine,
} from './tools/userActionToolMachine.js';

// Context
export const initialToolMachineContext: ToolMachineContext = {
	libraryName: '',
	libraryCommand: '',
	library: undefined,

	showSendCommand: false,
	sendCommandActorRef: undefined,

	run: undefined,
	tools: [],
	toolRefs: {},
	toolOutputs: [],

	showChat: false,
	isLoading: false,
	isError: false,
	errorMessage: '',
};

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
			pendingTools[0].status = 'active';
			resolve(context.tools);
		} else {
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
		initial: ToolState.ACTIVATING_PENDING_TOOL,
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

									const fileExtension = activeToolArguments.file_extension
										? activeToolArguments.file_extension
										: 'ts';
									const activeToolRef = spawn(
										createFileToolMachine.withContext({
											...initialCreateFileToolMachineContext,
											filePath: activeToolArguments.file_path,
											fileExtension,
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
					{
						cond: context => getActiveTool(context)?.name === 'user_action',
						actions: [
							assign({
								toolRefs: context => {
									const activeTool = getActiveTool(context);
									if (!activeTool) {
										throw new Error('Active tool not found');
									}
									const activeToolArguments =
										activeTool.arguments as UserActionToolArguments;

									const activeToolRef = spawn(
										userActionToolMachine.withContext({
											...initialUserActionToolContext,
											actionItem: activeToolArguments.action_item,
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
					[ToolEvent.TOGGLE_CHAT]: {
						actions: assign({showChat: context => !context.showChat}),
					},
					[ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT]: {
						actions: [
							assign({
								toolOutputs: (context, event) => {
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
				entry: [assign({isLoading: true})],
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
				exit: [assign({isLoading: false})],
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
