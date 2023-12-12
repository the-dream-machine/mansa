import {type DoneInvokeEvent, assign, createMachine} from 'xstate';
import {v4 as uuid} from 'uuid';
import {type FileMapItem} from '../types/FileMapItem.js';
import {type RepoConfig} from '../types/Repo.js';
import {
	type RunStatusResponse,
	type Run,
	type RunStatus,
} from '../types/Run.js';
import {getRepositoryMap} from '../utils/repository/getRepositoryMap.js';
import {getRepositoryConfig} from '../utils/repository/getRepositoryConfig.js';
import {sendQuery} from '../utils/api/sendQuery.js';
import {$, fs, sleep} from 'zx';
import {getQueryStatus} from '../utils/api/getQueryStatus.js';
import {getQueryResult} from '../utils/api/getQueryResult.js';
import {
	type ReadFileToolParams,
	type CreateFileToolParams,
	type EditFileToolParams,
	type RunCommandToolParams,
} from '../types/ToolParams.js';
import {writeToFile} from '../utils/writeToFile.js';
import {
	type RequiredActionFunctionToolCall,
	type ToolOutput,
} from '../types/Tool.js';
import {submitToolOutputs} from '../utils/api/submitToolOutputs.js';
import {getLibrary} from '../utils/api/getLibrary.js';
import {type Library} from '../types/Library.js';

interface Message {
	id: string;
	message: string;
}

interface ChatMachineContext {
	libraryName: string;
	library?: Library;
	run?: Run;
	retrievalRun?: Run;
	isRetrievalRun: boolean;
	repositoryMap?: FileMapItem[];
	repositoryConfig?: RepoConfig;
	messages: Message[];
	toolCalls: RequiredActionFunctionToolCall[];
	currentToolCallProcessingIndex: number;
	toolOutputs: ToolOutput[];
	query: string;
	status?: RunStatus;

	// Component states
	enterLabel: string;
	isLoading: boolean;
	isWorking: boolean;
	isSuccess: boolean;
	isError: boolean;
	errorMessage?: string;
}

const initialChatMachineContext: ChatMachineContext = {
	libraryName: '',
	library: undefined,
	run: undefined,
	retrievalRun: undefined,
	isRetrievalRun: true,
	repositoryMap: [],
	repositoryConfig: undefined,
	messages: [],
	toolCalls: [],
	currentToolCallProcessingIndex: 0,
	toolOutputs: [],
	query: '',
	status: undefined,

	enterLabel: 'submit',
	isLoading: false,
	isWorking: false,
	isSuccess: false,
	isError: false,
	errorMessage: '',
};

export enum ChatState {
	FETCHING_LIBRARY = 'FETCHING_LIBRARY',
	FETCHING_REPOSITORY_MAP = 'FETCHING_REPOSITORY_MAP',
	FETCHING_REPOSITORY_CONFIG = 'FETCHING_REPOSITORY_CONFIG',
	SENDING_INITIAL_QUERY = 'SENDING_INITIAL_QUERY',
	SENDING_QUERY = 'SENDING_QUERY',
	POLLING_QUERY_STATUS = 'POLLING_QUERY_STATUS',
	PROCESSING_TOOL_CALLS = 'PROCESSING_TOOL_CALLS',
	SUBMITTING_TOOL_CALLS = 'SUBMITTING_TOOL_CALLS',
	FETCHING_QUERY_RESULT = 'FETCHING_QUERY_RESULT',
	SUCCESS_IDLE = 'SUCCESS_IDLE',
	ERROR_IDLE = 'ERROR_IDLE',
}

type ChatMachineState =
	| {
			value: ChatState.FETCHING_LIBRARY;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.FETCHING_REPOSITORY_MAP;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.FETCHING_REPOSITORY_CONFIG;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.SENDING_INITIAL_QUERY;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.SENDING_QUERY;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.POLLING_QUERY_STATUS;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.PROCESSING_TOOL_CALLS;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.SUBMITTING_TOOL_CALLS;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.FETCHING_QUERY_RESULT;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.SUCCESS_IDLE;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.ERROR_IDLE;
			context: ChatMachineContext;
	  };

export enum ChatEvent {
	ENTER_KEY_PRESS = 'ENTER_KEY_PRESS',
	SEND_QUERY = 'SEND_QUERY',
}

type ChatMachineEvent =
	| {type: ChatEvent.ENTER_KEY_PRESS}
	| {type: ChatEvent.SEND_QUERY; query: string};

// Guards
const isLastToolCall = (context: ChatMachineContext) =>
	context.toolCalls.length - 1 === context.currentToolCallProcessingIndex;

// Tool handlers
const createFileToolCall = async (args: CreateFileToolParams) => {
	const {file_path, file_content} = args;
	await writeToFile({filePath: file_path, fileContent: file_content});
	return JSON.stringify({success: true});
};

const readFileToolCall = async (args: ReadFileToolParams) => {
	const {filePath} = args;
	const fileContent = await fs.readFile(filePath);
	return JSON.stringify({filePath, fileContent});
};

const editFileToolCall = async (args: EditFileToolParams) => {
	const {filePath, fileContent} = args;
	await writeToFile({filePath, fileContent});
	return JSON.stringify({success: true});
};

const getRepositoryMetadataToolCall = async () => {
	const repositoryMap = await getRepositoryMap();
	const packageJsonMapItem = repositoryMap.find(
		mapItem => mapItem.filePath === 'package.json',
	);
	return JSON.stringify({metadata: packageJsonMapItem?.fileSummary});
};

const runCommandToolCall = async (args: RunCommandToolParams) => {
	console.log('🌱 # args:', args);
	const {command} = args;
	console.log('🌱 # command:', command);
	/**
	 * You have to pass in commands as an array
	 * @see: https://google.github.io/zx/quotes#assembling-commands
	 */
	const commandArgs = command.split(' ');
	console.log('🌱 # commandArgs:', commandArgs);
	const process = await $`${commandArgs}`.quiet();
	console.log('🌱 # process:', process);
	return JSON.stringify({success: true});
};

export const chatMachine = createMachine<
	ChatMachineContext,
	ChatMachineEvent,
	ChatMachineState
>({
	id: 'chatMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	context: initialChatMachineContext,
	initial: ChatState.FETCHING_LIBRARY,
	states: {
		[ChatState.FETCHING_LIBRARY]: {
			invoke: {
				src: async context => await getLibrary({name: context.libraryName}),
				onDone: {
					actions: assign({
						library: (_, event: DoneInvokeEvent<Library>) => event.data,
					}),
					target: ChatState.FETCHING_REPOSITORY_MAP,
				},
				onError: {
					target: ChatState.ERROR_IDLE,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
		},
		[ChatState.FETCHING_REPOSITORY_MAP]: {
			invoke: {
				src: async () => await getRepositoryMap(),
				onDone: {
					target: ChatState.FETCHING_REPOSITORY_CONFIG,
					actions: assign({
						repositoryMap: (_, event: DoneInvokeEvent<FileMapItem[]>) =>
							event.data,
					}),
				},
			},
		},
		[ChatState.FETCHING_REPOSITORY_CONFIG]: {
			invoke: {
				src: async () => await getRepositoryConfig(),
				onDone: {
					target: ChatState.SENDING_INITIAL_QUERY,
					actions: assign({
						repositoryConfig: (_, event: DoneInvokeEvent<RepoConfig>) =>
							event.data,
					}),
				},
			},
		},
		[ChatState.SENDING_INITIAL_QUERY]: {
			always: [
				{
					actions: assign({
						query: context =>
							`How do I manually set up ${context.library?.name} in my repository?`,
					}),
					target: ChatState.SENDING_QUERY,
				},
			],
		},
		[ChatState.SENDING_QUERY]: {
			invoke: {
				src: async ({query, isRetrievalRun, run, retrievalRun, library}) => {
					if (!library?.id) {
						throw new Error("Couldn't find library. Please retry");
					}
					const queryRun = isRetrievalRun ? retrievalRun : run;
					return await sendQuery({
						query,
						thread_id: queryRun?.thread_id,
						libraryId: library.id,
						isRetrievalRun,
					});
				},
				onDone: [
					{
						cond: context => context.isRetrievalRun,
						target: ChatState.POLLING_QUERY_STATUS,
						actions: assign({
							retrievalRun: (_, event: DoneInvokeEvent<Run>) => event.data,
						}),
					},
					{
						cond: context => !context.isRetrievalRun,
						target: ChatState.POLLING_QUERY_STATUS,
						actions: assign({
							run: (_, event: DoneInvokeEvent<Run>) => event.data,
						}),
					},
				],
				onError: {
					target: ChatState.ERROR_IDLE,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
		},
		[ChatState.POLLING_QUERY_STATUS]: {
			entry: [assign({isLoading: true})],
			invoke: {
				src: async ({isRetrievalRun, retrievalRun, run}) => {
					await sleep(10000);
					const queryRun = isRetrievalRun ? retrievalRun : run;
					if (!queryRun) {
						throw new Error('Run ID not found');
					}
					const status = await getQueryStatus(queryRun);
					console.log('🌱 # status:', status);
					return status;
				},
				onDone: [
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							event.data.status === 'requires_action',
						actions: [
							assign((_, event: DoneInvokeEvent<RunStatusResponse>) => ({
								status: event.data.status,
								toolCalls:
									event.data.required_action.submit_tool_outputs.tool_calls,
							})),
							() => console.log('Requires action condition'),
						],
						target: ChatState.PROCESSING_TOOL_CALLS,
					},
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							event.data.status === 'completed',
						actions: assign((_, event: DoneInvokeEvent<RunStatusResponse>) => ({
							status: event.data.status,
						})),
						target: ChatState.FETCHING_QUERY_RESULT,
					},
					// If status is not completed, keep polling
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							!(event.data.status === 'completed'),
						actions: assign((_, event: DoneInvokeEvent<RunStatusResponse>) => ({
							status: event.data.status,
						})),
						target: ChatState.POLLING_QUERY_STATUS,
					},
				],
				onError: {
					target: ChatState.ERROR_IDLE,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
			exit: [assign({isLoading: false})],
		},
		[ChatState.FETCHING_QUERY_RESULT]: {
			invoke: {
				src: async ({isRetrievalRun, retrievalRun, run}) => {
					const queryRun = isRetrievalRun ? retrievalRun : run;
					if (!queryRun?.thread_id) {
						throw new Error('Thread ID not found');
					}
					return await getQueryResult({
						thread_id: queryRun.thread_id,
					});
				},
				onDone: [
					{
						cond: context => context.isRetrievalRun,
						target: ChatState.SENDING_QUERY,
						actions: assign((context, event: DoneInvokeEvent<string>) => ({
							messages: [
								...context.messages,
								{id: uuid(), message: event.data},
							],
							query: `Apply these steps to my project. Walk me through each step as we apply them together.
Steps: ${event.data}`,
							isRetrievalRun: false,
						})),
					},
					{
						cond: context => !context.isRetrievalRun,
						target: ChatState.SUCCESS_IDLE,
						actions: assign((context, event: DoneInvokeEvent<string>) => ({
							messages: [
								...context.messages,
								{id: uuid(), message: event.data},
							],
						})),
					},
				],
				onError: {
					target: ChatState.ERROR_IDLE,
					actions: assign((_, event: DoneInvokeEvent<Error>) => ({
						errorMessage: event.data.message,
					})),
				},
			},
		},
		[ChatState.PROCESSING_TOOL_CALLS]: {
			invoke: {
				src: async context => {
					const toolCall =
						context.toolCalls[context.currentToolCallProcessingIndex];
					console.log('🌱 # toolCall:', toolCall);
					const args = JSON.parse(toolCall?.function.arguments ?? '');
					console.log('🌱 # args:', args);

					if (toolCall?.function.name === 'create_file') {
						const output = await createFileToolCall(
							args as unknown as CreateFileToolParams,
						);
						return {tool_call_id: toolCall.id, output};
					}
					if (toolCall?.function.name === 'read_file') {
						const output = await readFileToolCall(
							args as unknown as ReadFileToolParams,
						);
						return {tool_call_id: toolCall.id, output};
					}
					if (toolCall?.function.name === 'edit_file') {
						const output = await editFileToolCall(
							args as unknown as EditFileToolParams,
						);
						return {tool_call_id: toolCall.id, output};
					}
					if (toolCall?.function.name === 'run_command') {
						const output = await runCommandToolCall(
							args as unknown as RunCommandToolParams,
						);
						return {tool_call_id: toolCall.id, output};
					}
					if (toolCall?.function.name === 'get_repository_metadata') {
						const output = await getRepositoryMetadataToolCall();
						console.log('🌱 # output:', output);
						return {tool_call_id: toolCall.id, output};
					}
					return;
				},
				onDone: [
					// Loop until last tool call is processed
					{
						cond: context => !isLastToolCall(context),
						actions: assign((context, event: DoneInvokeEvent<ToolOutput>) => ({
							toolOutputs: [...context.toolOutputs, event.data],
							currentToolCallProcessingIndex:
								context.currentToolCallProcessingIndex + 1,
						})),
						target: ChatState.PROCESSING_TOOL_CALLS,
					},
					{
						cond: context => isLastToolCall(context),
						actions: assign((context, event: DoneInvokeEvent<ToolOutput>) => ({
							toolOutputs: [...context.toolOutputs, event.data],
						})),
						target: ChatState.SUBMITTING_TOOL_CALLS,
					},
				],
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log('Something went wrong:', event.data),
				},
			},
		},
		[ChatState.SUBMITTING_TOOL_CALLS]: {
			invoke: {
				src: async ({isRetrievalRun, retrievalRun, run, toolOutputs}) => {
					const queryRun = isRetrievalRun ? retrievalRun : run;
					if (!queryRun) {
						throw new Error('Run not found');
					}
					return await submitToolOutputs({
						run: queryRun,
						toolOutputs,
					});
				},
				onDone: {
					target: ChatState.POLLING_QUERY_STATUS,
					actions: assign({toolOutputs: initialChatMachineContext.toolOutputs}),
				},
			},
		},
		[ChatState.SUCCESS_IDLE]: {
			on: {
				[ChatEvent.SEND_QUERY]: {
					actions: assign({
						query: (_, event) => event.query,
					}),
					target: ChatState.SENDING_QUERY,
				},
			},
		},
		[ChatState.ERROR_IDLE]: {
			entry: [assign({isError: true, enterLabel: 'retry'})],
			on: {
				[ChatEvent.SEND_QUERY]: {
					actions: assign({
						query: (_, event) => event.query,
					}),
					target: ChatState.SENDING_QUERY,
				},
			},
			exit: [
				assign({
					isError: initialChatMachineContext.isError,
					enterLabel: initialChatMachineContext.enterLabel,
				}),
			],
		},
	},
});
