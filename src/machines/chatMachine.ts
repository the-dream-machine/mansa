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
import {fs, path, sleep} from 'zx';
import {getQueryStatus} from '../utils/api/getQueryStatus.js';
import {getQueryResult} from '../utils/api/getQueryResult.js';
import {
	type ReadFileToolParams,
	type CreateFileToolParams,
	type EditFileToolParams,
	type FindFileByPathToolParams,
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
	isUser?: boolean;
	isRetrievalRun?: boolean;
	isTool?: boolean;
	isAssistant?: boolean;
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
	enterDisabled: boolean;
	isLoading: boolean;
	loadingMessage: string;
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
	isRetrievalRun: false,
	repositoryMap: [],
	repositoryConfig: undefined,
	messages: [],
	toolCalls: [],
	currentToolCallProcessingIndex: 0,
	toolOutputs: [],
	query: '',
	status: undefined,

	enterLabel: 'send',
	enterDisabled: true,
	isLoading: false,
	loadingMessage: '',
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
	ROUTING_TOOL_CALLS = 'ROUTING_TOOL_CALLS',
	PROCESSING_GET_REPOSITORY_SUMMARY_TOOL_CALL = 'PROCESSING_GET_REPOSITORY_SUMMARY_TOOL_CALL',
	PROCESSING_FIND_FILE_BY_PATH_TOOL_CALL = 'PROCESSING_FIND_FILE_BY_PATH_TOOL_CALL',
	PROCESSING_READ_FILE_TOOL_CALL = 'PROCESSING_READ_FILE_TOOL_CALL',
	PROCESSING_CREATE_FILE_TOOL_CALL = 'PROCESSING_CREATE_FILE_TOOL_CALL',
	PROCESSING_EDIT_FILE_TOOL_CALL = 'PROCESSING_EDIT_FILE_TOOL_CALL',
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
			value: ChatState.ROUTING_TOOL_CALLS;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.PROCESSING_GET_REPOSITORY_SUMMARY_TOOL_CALL;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.PROCESSING_FIND_FILE_BY_PATH_TOOL_CALL;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.PROCESSING_READ_FILE_TOOL_CALL;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.PROCESSING_CREATE_FILE_TOOL_CALL;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.PROCESSING_EDIT_FILE_TOOL_CALL;
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
const isLastToolCall = (context: ChatMachineContext) => {
	return context.toolCalls.length === context.currentToolCallProcessingIndex;
};

// Tool handlers
const getRepositorySummaryToolCall = async (
	context: ChatMachineContext,
): Promise<ToolOutput> => {
	const toolCall = context.toolCalls[context.currentToolCallProcessingIndex];
	if (!toolCall) {
		throw new Error('getRepositorySummaryToolCall: Tool call is undefined');
	}

	const repositoryMap = await getRepositoryMap();
	const packageJsonMapItem = repositoryMap.find(
		mapItem => mapItem.filePath === 'package.json',
	);
	const output = JSON.stringify({summary: packageJsonMapItem?.fileSummary});
	return {tool_call_id: toolCall.id, output};
};

const findFileByPathToolCall = async (
	context: ChatMachineContext,
): Promise<ToolOutput> => {
	const toolCall = context.toolCalls[context.currentToolCallProcessingIndex];
	console.log('🌱 # toolCall:', toolCall);
	if (!toolCall) {
		throw new Error('findFileByPathToolCall: Tool call is undefined');
	}

	const args = (await JSON.parse(
		toolCall.function.arguments,
	)) as unknown as FindFileByPathToolParams;

	const dirname = path.dirname(args.file_path);
	const output = JSON.stringify({does_file_exist: await fs.exists(dirname)});
	console.log('🌱 # findFileByPathToolCall output:', output);
	return {tool_call_id: toolCall.id, output};
};

const readFileToolCall = async (
	context: ChatMachineContext,
): Promise<ToolOutput> => {
	const toolCall = context.toolCalls[context.currentToolCallProcessingIndex];
	console.log('🌱 # read file toolCall:', toolCall);
	if (!toolCall) {
		throw new Error('readFileToolCall: Tool call is undefined');
	}

	const args = (await JSON.parse(
		toolCall.function.arguments,
	)) as unknown as ReadFileToolParams;
	console.log('🌱 # read file args:', args);

	try {
		const fileContent = (await fs.readFile(args.file_path)).toString();
		const output = JSON.stringify({file_content: fileContent});
		console.log('🌱 # read file output:', {
			tool_call_id: toolCall.id,
			output,
		});
		return {tool_call_id: toolCall.id, output};
	} catch (error) {
		const output = JSON.stringify({error: 'file does not exist'});
		return {tool_call_id: toolCall.id, output};
	}
};

const createFileToolCall = async (
	context: ChatMachineContext,
): Promise<ToolOutput> => {
	const toolCall = context.toolCalls[context.currentToolCallProcessingIndex];
	if (!toolCall) {
		throw new Error('createFileToolCall: Tool call is undefined');
	}

	const args = (await JSON.parse(
		toolCall.function.arguments,
	)) as unknown as CreateFileToolParams;

	try {
		await writeToFile({
			filePath: args.file_path,
			fileContent: args.file_content,
		});
		const output = JSON.stringify({response: 'file created successfully'});
		return {tool_call_id: toolCall.id, output};
	} catch (error) {
		const output = JSON.stringify({error});
		return {tool_call_id: toolCall.id, output};
	}
};

const editFileToolCall = async (
	context: ChatMachineContext,
): Promise<ToolOutput> => {
	const toolCall = context.toolCalls[context.currentToolCallProcessingIndex];
	if (!toolCall) {
		throw new Error('editFileToolCall: Tool call is undefined');
	}

	const args = (await JSON.parse(
		toolCall.function.arguments,
	)) as unknown as EditFileToolParams;

	try {
		await writeToFile({
			filePath: args.file_path,
			fileContent: args.file_content,
		});
		const output = JSON.stringify({response: 'file edit successfully'});
		return {tool_call_id: toolCall.id, output};
	} catch (error) {
		const output = JSON.stringify({error});
		return {tool_call_id: toolCall.id, output};
	}
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
					target: ChatState.SUCCESS_IDLE,
					actions: assign({
						repositoryConfig: (_, event: DoneInvokeEvent<RepoConfig>) =>
							event.data,
					}),
				},
			},
		},
		// 		[ChatState.SENDING_INITIAL_QUERY]: {
		// 			always: [
		// 				{
		// 					actions: assign({
		// isRetrievalRun: true,
		// 						query: context => {
		// 							const packageJsonMapItem = context.repositoryMap?.find(
		// 								mapItem => mapItem.filePath === 'package.json',
		// 							);
		// 							const summary = packageJsonMapItem?.fileSummary;
		// 							const packageManager = context.repositoryConfig?.packageManager;
		// 							const libraryName = context.library?.name;
		// 							return `Here is a summary of my repository: "${summary}. The repository uses the '${packageManager}' package manager."
		// Question: "Given this information, how do I manually install the '${libraryName}' library in my repository?" (Respond with a complete guide).`;
		// 						},
		// 					}),
		// 					target: ChatState.SENDING_QUERY,
		// 				},
		// 			],
		// 		},
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
						],
						target: ChatState.ROUTING_TOOL_CALLS,
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
								{
									id: uuid(),
									message: event.data,
									isRetrievalRun: context.isRetrievalRun,
								},
							],
							query: `${event.data}
Walk me through each step one at a time. Let's start with the first step.`,
							isRetrievalRun: false,
						})),
					},
					{
						cond: context => !context.isRetrievalRun,
						target: ChatState.SUCCESS_IDLE,
						actions: assign((context, event: DoneInvokeEvent<string>) => ({
							messages: [
								...context.messages,
								{
									id: uuid(),
									message: event.data,
									isAssistant: true,
								},
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
		[ChatState.ROUTING_TOOL_CALLS]: {
			always: [
				{
					cond: context => isLastToolCall(context),
					target: ChatState.SUBMITTING_TOOL_CALLS,
				},
				{
					cond: context =>
						context.toolCalls[context.currentToolCallProcessingIndex]?.function
							.name === 'get_repository_summary',
					target: ChatState.PROCESSING_GET_REPOSITORY_SUMMARY_TOOL_CALL,
					actions: [
						() => console.log('Getting repository summary'),
						assign({
							messages: context => [
								...context.messages,
								{
									id: uuid(),
									isTool: true,
									message: '👀 Reading a summary of your repository',
								},
							],
						}),
					],
				},
				{
					cond: context =>
						context.toolCalls[context.currentToolCallProcessingIndex]?.function
							.name === 'find_file_by_path',
					target: ChatState.PROCESSING_FIND_FILE_BY_PATH_TOOL_CALL,
					actions: assign({
						messages: context => {
							const args = JSON.parse(
								context.toolCalls[context.currentToolCallProcessingIndex]
									?.function.arguments ?? '',
							) as unknown as FindFileByPathToolParams;

							return [
								...context.messages,
								{
									id: uuid(),
									isTool: true,
									message: `🔎 Searching for ${args.file_path}`,
								},
							];
						},
					}),
				},
				{
					cond: context =>
						context.toolCalls[context.currentToolCallProcessingIndex]?.function
							.name === 'read_file',
					target: ChatState.PROCESSING_READ_FILE_TOOL_CALL,
					actions: assign({
						messages: context => {
							const args = JSON.parse(
								context.toolCalls[context.currentToolCallProcessingIndex]
									?.function.arguments ?? '',
							) as unknown as ReadFileToolParams;

							return [
								...context.messages,
								{
									id: uuid(),
									isTool: true,
									message: `📖 Reading ${args.file_path}`,
								},
							];
						},
					}),
				},
				{
					cond: context =>
						context.toolCalls[context.currentToolCallProcessingIndex]?.function
							.name === 'create_file',
					target: ChatState.PROCESSING_CREATE_FILE_TOOL_CALL,
					actions: assign({
						messages: context => {
							const args = JSON.parse(
								context.toolCalls[context.currentToolCallProcessingIndex]
									?.function.arguments ?? '',
							) as unknown as CreateFileToolParams;

							return [
								...context.messages,
								{
									id: uuid(),
									isTool: true,
									message: `🛠️ Creating ${args.file_path}`,
								},
							];
						},
					}),
				},
				{
					cond: context =>
						context.toolCalls[context.currentToolCallProcessingIndex]?.function
							.name === 'edit_file',
					target: ChatState.PROCESSING_EDIT_FILE_TOOL_CALL,
					actions: assign({
						messages: context => {
							const args = JSON.parse(
								context.toolCalls[context.currentToolCallProcessingIndex]
									?.function.arguments ?? '',
							) as unknown as EditFileToolParams;

							return [
								...context.messages,
								{
									id: uuid(),
									isTool: true,
									message: `✨ Editing ${args.file_path}`,
								},
							];
						},
					}),
				},
			],
		},
		[ChatState.PROCESSING_GET_REPOSITORY_SUMMARY_TOOL_CALL]: {
			invoke: {
				src: async context => getRepositorySummaryToolCall(context),
				onDone: {
					actions: assign((context, event: DoneInvokeEvent<ToolOutput>) => ({
						toolOutputs: [...context.toolOutputs, event.data],
						currentToolCallProcessingIndex:
							context.currentToolCallProcessingIndex + 1,
					})),
					target: ChatState.ROUTING_TOOL_CALLS,
				},
			},
		},
		[ChatState.PROCESSING_FIND_FILE_BY_PATH_TOOL_CALL]: {
			invoke: {
				src: async context => findFileByPathToolCall(context),
				onDone: {
					actions: assign((context, event: DoneInvokeEvent<ToolOutput>) => ({
						toolOutputs: [...context.toolOutputs, event.data],
						currentToolCallProcessingIndex:
							context.currentToolCallProcessingIndex + 1,
					})),
					target: ChatState.ROUTING_TOOL_CALLS,
				},
				onError: {
					actions: (_, event) =>
						console.log('PROCESSING_FIND_FILE_BY_PATH_TOOL_CALL:', event.data),
				},
			},
		},
		[ChatState.PROCESSING_READ_FILE_TOOL_CALL]: {
			invoke: {
				src: async context => readFileToolCall(context),
				onDone: {
					actions: assign((context, event: DoneInvokeEvent<ToolOutput>) => ({
						toolOutputs: [...context.toolOutputs, event.data],
						currentToolCallProcessingIndex:
							context.currentToolCallProcessingIndex + 1,
					})),
					target: ChatState.ROUTING_TOOL_CALLS,
				},
			},
		},
		[ChatState.PROCESSING_CREATE_FILE_TOOL_CALL]: {
			invoke: {
				src: async context => createFileToolCall(context),
				onDone: {
					actions: assign((context, event: DoneInvokeEvent<ToolOutput>) => ({
						toolOutputs: [...context.toolOutputs, event.data],
						currentToolCallProcessingIndex:
							context.currentToolCallProcessingIndex + 1,
					})),
					target: ChatState.ROUTING_TOOL_CALLS,
				},
			},
		},
		[ChatState.PROCESSING_EDIT_FILE_TOOL_CALL]: {
			invoke: {
				src: async context => editFileToolCall(context),
				onDone: {
					actions: assign((context, event: DoneInvokeEvent<ToolOutput>) => ({
						toolOutputs: [...context.toolOutputs, event.data],
						currentToolCallProcessingIndex:
							context.currentToolCallProcessingIndex + 1,
					})),
					target: ChatState.ROUTING_TOOL_CALLS,
				},
			},
		},
		[ChatState.SUBMITTING_TOOL_CALLS]: {
			invoke: {
				src: async ({isRetrievalRun, retrievalRun, run, toolOutputs}) => {
					console.log('🌱 # toolOutputs:', toolOutputs);
					const queryRun = isRetrievalRun ? retrievalRun : run;
					if (!queryRun) {
						throw new Error('Run not found');
					}
					return await submitToolOutputs({run: queryRun, toolOutputs});
				},
				onDone: {
					target: ChatState.POLLING_QUERY_STATUS,
					actions: assign({
						toolOutputs: initialChatMachineContext.toolOutputs,
						currentToolCallProcessingIndex:
							initialChatMachineContext.currentToolCallProcessingIndex,
					}),
				},
				onError: {
					actions: (_, events) => console.log(events.data),
				},
			},
		},
		[ChatState.SUCCESS_IDLE]: {
			entry: [assign({enterDisabled: false})],
			on: {
				[ChatEvent.SEND_QUERY]: {
					actions: [
						assign((context, event) => ({
							query: event.query,
							messages: [
								...context.messages,
								{
									id: uuid(),
									isUser: true,
									message: event.query,
								},
							],
						})),
					],
					target: ChatState.SENDING_QUERY,
				},
			},
			exit: [assign({enterDisabled: true})],
		},
		[ChatState.ERROR_IDLE]: {
			entry: [
				assign({isError: true, enterLabel: 'retry', enterDisabled: false}),
			],
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
					enterDisabled: true,
				}),
			],
		},
	},
});
