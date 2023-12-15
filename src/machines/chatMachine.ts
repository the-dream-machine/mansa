import {type DoneInvokeEvent, assign, createMachine} from 'xstate';
import {v4 as uuid} from 'uuid';
import {type RepoConfig} from '../types/Repo.js';
import {type RunStatusResponse, type Run} from '../types/Run.js';
import {getRepositoryMap} from '../utils/repository/getRepositoryMap.js';
import {getRepositoryConfig} from '../utils/repository/getRepositoryConfig.js';
import {sendQuery} from '../utils/api/sendQuery.js';
import {fs, sleep} from 'zx';
import {getQueryStatus} from '../utils/api/getQueryStatus.js';
import {getQueryResult} from '../utils/api/getQueryResult.js';
import {
	type ReadFileToolParams,
	type EditFileToolParams,
} from '../types/ToolParams.js';
import {writeToFile} from '../utils/writeToFile.js';
import {type ToolOutput} from '../types/Tool.js';
import {submitToolOutputs} from '../utils/api/submitToolOutputs.js';
import {getLibrary} from '../utils/api/getLibrary.js';
import {type Library} from '../types/Library.js';
import {sendRetrievalCommand} from '../utils/api/sendRetrievalCommand.js';
import {sendAssistantCommand} from '../utils/api/sendAssistantCommand.js';
import {
	ChatEvent,
	type ChatMachineContext,
	type ChatMachineEvent,
} from '../types/ChatMachine.js';
import {createFileActor} from '../utils/actors/createFileActor.js';
import {getRepositorySummaryActor} from '../utils/actors/getRepositorySummaryActor.js';
import {findFileByPathActor} from '../utils/actors/findFileByPathActor.js';
import {readFileActor} from '../utils/actors/readFileActor.js';

const initialChatMachineContext: ChatMachineContext = {
	commandName: '',
	libraryName: '',
	library: undefined,
	run: undefined,
	retrievalRun: undefined,
	isRetrievalRun: false,
	retrievalContext: '',
	repositoryConfig: undefined,
	activeToolActor: undefined,
	messages: [],
	// toolCalls: [],
	toolCalls: [
		// {
		// 	id: 'call_6xjrWUSKy3Mkp9vtL85GVDzW',
		// 	type: 'function',
		// 	function: {
		// 		name: 'find_file_by_path',
		// 		arguments: '{"file_path":".env.local"}',
		// 	},
		// },
		{
			id: 'call_6xjrWUSKy3Mkp9vtmfk325GVDzW',
			type: 'function',
			function: {
				name: 'read_file',
				arguments: '{"file_path":"./package.json"}',
			},
		},

		{
			id: 'call_FLXT7DtAlblCWo1rcrEvLVQI',
			type: 'function',
			function: {
				name: 'get_repository_summary',
				arguments: '{}',
			},
		},

		// {
		// 	id: 'call_6TAdGAVYnMQmTTkpeEERNOVg',
		// 	type: 'function',
		// 	function: {
		// 		name: 'create_file',
		// 		arguments:
		// 			'{"file_path": "./src/Jobs/example.ts", "file_content": "import { eventTrigger } from \\"@trigger.dev/sdk\\"\\nimport { client } from \\"@/trigger\\" // Replace \\"@/trigger\\" with the relative path to your Trigger Client configuration file\\n\\nclient.defineJob({\\n  id: \\"example-job\\",\\n  name: \\"Example Job\\",\\n  version: \\"0.0.1\\",\\n  trigger: eventTrigger({\\n    name: \\"example.event\\",\\n  }),\\n  run: async (payload, io, ctx) => {\\n    await io.logger.info(\\"Hello world!\\", { payload })\\n\\n    return {\\n      message: \\"Hello world!\\",\\n    }\\n  },\\n})"}',
		// 	},
		// },
	],
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
	FETCHING_REPOSITORY_CONFIG = 'FETCHING_REPOSITORY_CONFIG',
	SENDING_RETRIEVAL_COMMAND = 'SENDING_RETRIEVAL_COMMAND',
	SENDING_ASSISTANT_COMMAND = 'SENDING_ASSISTANT_COMMAND',
	SENDING_QUERY = 'SENDING_QUERY',
	POLLING_QUERY_STATUS = 'POLLING_QUERY_STATUS',
	ROUTING_TOOL_CALLS = 'ROUTING_TOOL_CALLS',

	// Tool Calls
	HANDLING_GET_REPOSITORY_SUMMARY_TOOL_CALL = 'HANDLING_GET_REPOSITORY_SUMMARY_TOOL_CALL',
	HANDLING_CREATE_FILE_TOOL_CALL = 'HANDLING_CREATE_FILE_TOOL_CALL',
	HANDLING_FIND_FILE_BY_PATH_TOOL_CALL = 'HANDLING_FIND_FILE_BY_PATH_TOOL_CALL',
	HANDLING_READ_FILE_TOOL_CALL = 'HANDLING_READ_FILE_TOOL_CALL',
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
			value: ChatState.FETCHING_REPOSITORY_CONFIG;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.SENDING_RETRIEVAL_COMMAND;
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
			value: ChatState.HANDLING_GET_REPOSITORY_SUMMARY_TOOL_CALL;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.HANDLING_CREATE_FILE_TOOL_CALL;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.HANDLING_FIND_FILE_BY_PATH_TOOL_CALL;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.HANDLING_READ_FILE_TOOL_CALL;
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

// Guards
const isLastToolCall = (context: ChatMachineContext) => {
	return context.toolCalls.length === context.currentToolCallProcessingIndex;
};

// Tool handlers

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
	initial: ChatState.ROUTING_TOOL_CALLS,
	on: {
		[ChatEvent.ADD_MESSAGE]: {
			actions: assign({
				messages: (context, event) => [...context.messages, event.message],
			}),
		},
		[ChatEvent.SUBMIT_TOOL_OUTPUT]: {
			target: ChatState.ROUTING_TOOL_CALLS,
			actions: assign((context, event) => ({
				toolOutputs: [...context.toolOutputs, event.toolOutput],
				currentToolCallProcessingIndex:
					context.currentToolCallProcessingIndex + 1,
			})),
		},
	},
	states: {
		[ChatState.FETCHING_LIBRARY]: {
			invoke: {
				src: async context => await getLibrary({name: context.libraryName}),
				onDone: {
					actions: assign({
						library: (_, event: DoneInvokeEvent<Library>) => event.data,
					}),
					target: ChatState.FETCHING_REPOSITORY_CONFIG,
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
		[ChatState.FETCHING_REPOSITORY_CONFIG]: {
			invoke: {
				src: async () => await getRepositoryConfig(),
				onDone: {
					target: ChatState.SENDING_RETRIEVAL_COMMAND,
					actions: assign({
						repositoryConfig: (_, event: DoneInvokeEvent<RepoConfig>) =>
							event.data,
					}),
				},
			},
		},
		[ChatState.SENDING_RETRIEVAL_COMMAND]: {
			entry: [
				assign({
					enterDisabled: true,
					isRetrievalRun: true,
					messages: context => [
						...context.messages,
						{
							id: uuid(),
							text: ` 🌍 Reading documentation... `,
							isTool: true,
						},
					],
				}),
			],
			invoke: {
				src: async context => {
					const commandName = context.commandName;
					const libraryName = context.libraryName;
					const packageManager = context.repositoryConfig?.packageManager;
					const repositoryMap = await getRepositoryMap();
					const packageJsonMapItem = repositoryMap.find(
						mapItem => mapItem.filePath === 'package.json',
					);
					const repositorySummary = packageJsonMapItem?.fileSummary;
					if (!repositorySummary) {
						throw new Error('Repository summary missing');
					}
					if (!packageManager) {
						throw new Error('Package manager missing from config');
					}
					return await sendRetrievalCommand({
						commandName,
						libraryName,
						repositorySummary,
						packageManager,
					});
				},
				onDone: {
					target: ChatState.POLLING_QUERY_STATUS,
					actions: assign({
						retrievalRun: (_, event: DoneInvokeEvent<Run>) => event.data,
					}),
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
		[ChatState.SENDING_ASSISTANT_COMMAND]: {
			entry: [assign({isLoading: true})],
			invoke: {
				src: async context => {
					const libraryName = context.libraryName;
					const commandName = context.commandName;
					const retrievalContext = context.retrievalContext;
					return await sendAssistantCommand({
						retrievalContext,
						libraryName,
						commandName,
					});
				},

				onDone: {
					target: ChatState.POLLING_QUERY_STATUS,
					actions: assign({
						run: (_, event: DoneInvokeEvent<Run>) => event.data,
					}),
				},
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
					return await getQueryResult({thread_id: queryRun.thread_id});
				},
				onDone: [
					{
						cond: context => context.isRetrievalRun,
						target: ChatState.SENDING_ASSISTANT_COMMAND,
						actions: assign({
							isRetrievalRun: false,
							retrievalContext: (_, event: DoneInvokeEvent<string>) =>
								event.data,
						}),
					},
					{
						cond: context => !context.isRetrievalRun,
						target: ChatState.SUCCESS_IDLE,
						actions: assign((context, event: DoneInvokeEvent<string>) => ({
							messages: [
								...context.messages,
								{
									id: uuid(),
									text: event.data,
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
					target: ChatState.HANDLING_GET_REPOSITORY_SUMMARY_TOOL_CALL,
					actions: assign({
						activeToolActor: context => getRepositorySummaryActor(context),
					}),
				},
				{
					cond: context =>
						context.toolCalls[context.currentToolCallProcessingIndex]?.function
							.name === 'find_file_by_path',
					target: ChatState.HANDLING_FIND_FILE_BY_PATH_TOOL_CALL,
					actions: assign({
						activeToolActor: context => findFileByPathActor(context),
					}),
				},
				{
					cond: context =>
						context.toolCalls[context.currentToolCallProcessingIndex]?.function
							.name === 'read_file',
					target: ChatState.HANDLING_READ_FILE_TOOL_CALL,
					actions: assign({
						activeToolActor: context => readFileActor(context),
					}),
				},
				{
					cond: context =>
						context.toolCalls[context.currentToolCallProcessingIndex]?.function
							.name === 'create_file',
					target: ChatState.HANDLING_CREATE_FILE_TOOL_CALL,
					actions: assign({
						activeToolActor: context => createFileActor(context),
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
									text: ` ✨ Editing ${args.file_path} `,
								},
							];
						},
					}),
				},
			],
		},
		[ChatState.HANDLING_GET_REPOSITORY_SUMMARY_TOOL_CALL]: {},
		[ChatState.HANDLING_FIND_FILE_BY_PATH_TOOL_CALL]: {},
		[ChatState.HANDLING_READ_FILE_TOOL_CALL]: {},
		[ChatState.HANDLING_CREATE_FILE_TOOL_CALL]: {},
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
									text: event.query,
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
