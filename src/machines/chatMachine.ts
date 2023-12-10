import {type DoneInvokeEvent, assign, createMachine} from 'xstate';
import {type FileMapItem} from '../types/FileMapItem.js';
import {type RepoConfig} from '../types/Repo.js';
import {RunStatusResponse, type Run, RunStatus} from '../types/Run.js';
import {getRepositoryMap} from '../utils/repository/getRepositoryMap.js';
import {getRepositoryConfig} from '../utils/repository/getRepositoryConfig.js';
import {sendQueryMachine} from './sendQueryMachine.js';
import {initialSendQueryMachineContext} from '../utils/initialSendQueryMachineContext.js';
import {type SendQueryMachineResult} from '../types/SendQuery.js';
import {sendQuery} from '../utils/api/sendQuery.js';
import {sleep} from 'zx';
import {sendQueryStatus} from '../utils/api/sendQueryStatus.js';
import {sendQueryResult} from '../utils/api/sendQueryResult.js';

interface ChatMachineContext {
	run?: Run;
	repositoryMap?: FileMapItem[];
	repositoryConfig?: RepoConfig;
	messages: string[];
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
	run: undefined,
	repositoryMap: [],
	repositoryConfig: undefined,
	messages: [],
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
	FETCHING_REPOSITORY_MAP = 'FETCHING_REPOSITORY_MAP',
	FETCHING_REPOSITORY_CONFIG = 'FETCHING_REPOSITORY_CONFIG',
	SEND_INITIAL_QUERY = 'SEND_INITIAL_QUERY',
	SEND_QUERY = 'SEND_QUERY',
	POLLING_QUERY_STATUS = 'POLLING_QUERY_STATUS',
	FETCHING_QUERY_RESULT = 'FETCHING_QUERY_RESULT',
	SUCCESS_IDLE = 'SUCCESS_IDLE',
	ERROR_IDLE = 'ERROR_IDLE',

	// Functions
	SUBMIT_TOOL_OUTPUTS = 'SUBMIT_TOOL_OUTPUTS',
	CREATE_FILE = 'CREATE_FILE',
	READ_FILE = 'READ_FILE',
	EDIT_FILE = 'EDIT_FILE',
	RUN_COMMAND = 'RUN_COMMAND',
}

type ChatMachineState =
	| {
			value: ChatState.FETCHING_REPOSITORY_MAP;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.FETCHING_REPOSITORY_CONFIG;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.SEND_INITIAL_QUERY;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.SEND_QUERY;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.POLLING_QUERY_STATUS;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.FETCHING_QUERY_RESULT;
			context: ChatMachineContext;
	  }
	| {
			value: ChatState.SUBMIT_TOOL_OUTPUTS;
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
const isStatusCompleted = (event: DoneInvokeEvent<RunStatusResponse>) =>
	event.data.status === 'completed';
const isStatus = (event: DoneInvokeEvent<RunStatusResponse>) =>
	event.data.status === 'completed';

export const chatMachine = createMachine<
	ChatMachineContext,
	ChatMachineEvent,
	ChatMachineState
>({
	id: 'chatMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	context: initialChatMachineContext,
	initial: ChatState.FETCHING_REPOSITORY_MAP,
	states: {
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
					target: ChatState.SEND_QUERY,
					actions: assign({
						repositoryConfig: (_, event: DoneInvokeEvent<RepoConfig>) =>
							event.data,
					}),
				},
			},
		},
		[ChatState.SEND_INITIAL_QUERY]: {
			always: [
				{
					actions: assign({query: 'Hello there, how are you?'}),
					target: ChatState.SEND_QUERY,
				},
			],
		},
		[ChatState.SEND_QUERY]: {
			invoke: {
				src: async ({query, run}) =>
					await sendQuery({query, thread_id: run?.thread_id}),
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
		},
		[ChatState.POLLING_QUERY_STATUS]: {
			entry: [assign({isLoading: true})],
			invoke: {
				src: async context => {
					await sleep(1000);
					if (!context.run) {
						throw new Error('Run ID not found');
					}
					return await sendQueryStatus(context.run);
				},
				onDone: [
					{
						actions: assign({
							status: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status,
						}),
					},
					// If status is not completed, keep polling
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							!(event.data.status === 'completed'),
						target: ChatState.POLLING_QUERY_STATUS,
					},
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							event.data.status === 'requires_action',
						target: ChatState.SUBMIT_TOOL_OUTPUTS,
					},
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							event.data.status === 'completed',
						target: ChatState.FETCHING_QUERY_RESULT,
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
		[ChatState.FETCHING_QUERY_RESULT]: {
			invoke: {
				src: async context => {
					if (!context.run?.thread_id) {
						throw new Error('Thread ID not found');
					}
					return await sendQueryResult({
						thread_id: context.run.thread_id,
					});
				},
			},
		},
		[ChatState.SUBMIT_TOOL_OUTPUTS]: {
			// always:[
			// 	{cond: }
			// ]
		},
		[ChatState.SUCCESS_IDLE]: {
			on: {
				[ChatEvent.SEND_QUERY]: {
					actions: assign({
						query: (_, event) => event.query,
					}),
					target: ChatState.SEND_QUERY,
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
					target: ChatState.SEND_QUERY,
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
