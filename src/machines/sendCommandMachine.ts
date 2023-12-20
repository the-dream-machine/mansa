import {assign, createMachine, sendParent, type DoneInvokeEvent} from 'xstate';
import {type RunStatusResponse, type Run} from '../types/Run.js';
import {type Tool} from '../types/Tool.js';
import {sendRetrievalCommand} from '../utils/api/sendRetrievalCommand.js';
import {getRepositoryConfig} from '../utils/repository/getRepositoryConfig.js';
import {getQueryStatus} from '../utils/api/getQueryStatus.js';
import {getQueryResult} from '../utils/api/getQueryResult.js';
import {sendAssistantCommand} from '../utils/api/sendAssistantCommand.js';
import {ToolEvent} from '../types/ToolMachine.js';

// Context
export interface SendCommandMachineContext {
	libraryName: string;
	libraryCommand: string;
	run?: Run;
	retrievalResult: string;
	toolCalls: Tool[];

	statusLabel: string;
	enterLabel: 'start walkthrough' | 'retry';
	enterDisabled: boolean;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	errorMessage: string;
}

export const initialSendCommandMachineContext: SendCommandMachineContext = {
	libraryName: '',
	libraryCommand: '',
	run: undefined,
	retrievalResult: '',
	toolCalls: [],

	statusLabel: '',
	enterLabel: 'start walkthrough',
	enterDisabled: false,
	isLoading: false,
	isSuccess: false,
	isError: false,
	errorMessage: '',
};

// States
export enum SendCommandState {
	SENDING_RETRIEVAL_COMMAND = 'SENDING_RETRIEVAL_COMMAND',
	POLLING_RETRIEVAL_COMMAND_STATUS = 'POLLING_RETRIEVAL_COMMAND_STATUS',
	FETCHING_RETRIEVAL_COMMAND_RESULT = 'FETCHING_RETRIEVAL_COMMAND_RESULT',
	SENDING_ASSISTANT_COMMAND = 'SENDING_ASSISTANT_COMMAND',
	POLLING_ASSISTANT_COMMAND_STATUS = 'POLLING_ASSISTANT_COMMAND_STATUS',
	SUCCESS_IDLE = 'SUCCESS_IDLE',
	ERROR_IDLE = 'ERROR_IDLE',
	FINAL = 'FINAL',
}

export type SendCommandMachineState = {
	value: keyof typeof SendCommandState;
	context: SendCommandMachineContext;
};

// Events
export enum SendCommandEvent {
	ENTER_KEY_PRESSED = 'ENTER_KEY_PRESSED',
}

export type SendCommandMachineEvent = {
	type: SendCommandEvent.ENTER_KEY_PRESSED;
};

// Actions
enum SendCommandMachineAction {
	SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE',
}

// Result
export interface SendCommandResult {
	run: Run;
	tools: Tool[];
}

export const sendCommandMachine = createMachine<
	SendCommandMachineContext,
	SendCommandMachineEvent,
	SendCommandMachineState
>(
	{
		id: 'sendCommandMachine',
		preserveActionOrder: true,
		predictableActionArguments: true,
		context: initialSendCommandMachineContext,
		initial: SendCommandState.SENDING_RETRIEVAL_COMMAND,
		states: {
			[SendCommandState.SENDING_RETRIEVAL_COMMAND]: {
				entry: [
					assign({
						isLoading: true,
						statusLabel: 'Analyzing repository (1/2)',
						enterDisabled: true,
					}),
				],
				invoke: {
					src: async context => {
						const repositorySummary =
							"This is a Node.js project using Next.js framework and several libraries including Prisma for database interaction, React and React-DOM for UI, React Query for data fetching, TRPC for server and client communication, SuperJSON for serialization, Zod for data validation, and TypeScript for static typing. The repository uses the 'bun' package manager.";
						if (!repositorySummary) {
							throw new Error('Repository summary not found.');
						}

						const packageManager = (await getRepositoryConfig()).packageManager;
						return await sendRetrievalCommand({
							commandName: context.libraryCommand,
							libraryName: context.libraryName,
							repositorySummary,
							packageManager,
						});
					},
					onDone: {
						actions: assign({
							run: (_, event: DoneInvokeEvent<Run>) => event.data,
						}),
						target: SendCommandState.POLLING_RETRIEVAL_COMMAND_STATUS,
					},
					onError: {
						actions: [SendCommandMachineAction.SET_ERROR_MESSAGE],
						target: SendCommandState.ERROR_IDLE,
					},
				},
			},
			[SendCommandState.POLLING_RETRIEVAL_COMMAND_STATUS]: {
				invoke: {
					src: async context => {
						if (!context.run) {
							throw new Error('Retrieval run not found');
						}
						return await getQueryStatus({...context.run});
					},
					onDone: [
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'completed',
							target: SendCommandState.FETCHING_RETRIEVAL_COMMAND_RESULT,
						},
						{target: SendCommandState.POLLING_RETRIEVAL_COMMAND_STATUS},
					],
					onError: {
						actions: [SendCommandMachineAction.SET_ERROR_MESSAGE],
						target: SendCommandState.ERROR_IDLE,
					},
				},
			},
			[SendCommandState.FETCHING_RETRIEVAL_COMMAND_RESULT]: {
				invoke: {
					src: async context => {
						if (!context.run) {
							throw new Error('Retrieval run not found');
						}
						return await getQueryResult({
							thread_id: context.run?.thread_id,
						});
					},
					onDone: {
						target: SendCommandState.SENDING_ASSISTANT_COMMAND,
						actions: assign({
							retrievalResult: (_, event: DoneInvokeEvent<string>) =>
								event.data,
						}),
					},
					onError: {
						actions: [SendCommandMachineAction.SET_ERROR_MESSAGE],
						target: SendCommandState.ERROR_IDLE,
					},
				},
			},
			[SendCommandState.SENDING_ASSISTANT_COMMAND]: {
				entry: [assign({statusLabel: 'Planning walkthrough (2/2)'})],
				invoke: {
					src: async context => {
						const libraryName = context.libraryName;
						const commandName = context.libraryCommand;
						const retrievalContext = context.retrievalResult;
						return await sendAssistantCommand({
							retrievalContext,
							libraryName,
							commandName,
						});
					},
					onDone: {
						target: SendCommandState.POLLING_ASSISTANT_COMMAND_STATUS,
						actions: [
							assign({
								run: (_, event: DoneInvokeEvent<Run>) => event.data,
							}),
						],
					},
					onError: {
						actions: [SendCommandMachineAction.SET_ERROR_MESSAGE],
						target: SendCommandState.ERROR_IDLE,
					},
				},
			},
			[SendCommandState.POLLING_ASSISTANT_COMMAND_STATUS]: {
				invoke: {
					src: async context => {
						if (!context.run) {
							throw new Error('Retrieval run not found while polling status');
						}
						return await getQueryStatus({...context.run});
					},
					onDone: [
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'queued',
							target: SendCommandState.POLLING_ASSISTANT_COMMAND_STATUS,
						},
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'in_progress',
							target: SendCommandState.POLLING_ASSISTANT_COMMAND_STATUS,
						},
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'requires_action',
							actions: assign({
								toolCalls: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
									event.data.required_action.submit_tool_outputs.tool_calls,
							}),
							target: SendCommandState.SUCCESS_IDLE,
						},
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'completed',
							actions: assign({errorMessage: 'Invalid response format'}),
							target: SendCommandState.ERROR_IDLE,
						},
						{
							cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
								event.data.status === 'failed',
							actions: assign({errorMessage: 'Invalid response format'}),
							target: SendCommandState.ERROR_IDLE,
						},
					],
					onError: {
						actions: [SendCommandMachineAction.SET_ERROR_MESSAGE],
						target: SendCommandState.ERROR_IDLE,
					},
				},
			},

			[SendCommandState.SUCCESS_IDLE]: {
				entry: [
					assign({
						isLoading: false,
						isSuccess: true,
						statusLabel: 'Walkthrough ready',
						enterLabel: 'start walkthrough',
						enterDisabled: false,
					}),
				],
				on: {
					[SendCommandEvent.ENTER_KEY_PRESSED]: {
						target: SendCommandState.FINAL,
						actions: [
							sendParent(context => ({
								type: ToolEvent.SEND_COMMAND_UPDATE_TOOLS,
								result: {
									run: context.run,
									tools: context.toolCalls,
								},
							})),
						],
					},
				},
			},
			[SendCommandState.ERROR_IDLE]: {
				entry: [
					assign({
						isLoading: false,
						isError: true,
						enterDisabled: false,
						enterLabel: 'retry',
						statusLabel: 'Something went wrong',
					}),
				],
				on: {
					[SendCommandEvent.ENTER_KEY_PRESSED]: {
						target: SendCommandState.SENDING_RETRIEVAL_COMMAND,
					},
				},
				exit: [assign({isError: false})],
			},
			[SendCommandState.FINAL]: {
				type: 'final',
			},
		},
	},
	{
		actions: {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			[SendCommandMachineAction.SET_ERROR_MESSAGE]: assign({
				errorMessage: (_, event: DoneInvokeEvent<Error>) => event.data.message,
			}),
		},
	},
);
