import {
	createMachine,
	assign,
	type EventObject,
	type DoneInvokeEvent,
} from 'xstate';
import {sleep} from 'zx';

import {sendQuery} from '../utils/api/sendQuery.js';
import {sendQueryStatus} from '../utils/api/sendQueryStatus.js';
import {sendQueryResult} from '../utils/api/sendQueryResult.js';

import type {RunStatusResponse, Run} from '../types/Run.js';
import {initialSendQueryMachineContext} from '../utils/initialSendQueryMachineContext.js';

// Context
export interface QueryMachineContext {
	query: string;
	systemInstructions: string;
	responseParentKey: string;
	run: Run;
	errorMessage?: string;
	result: string;
	skipTransform: boolean;
	thread_id?: string;
}

// States
export enum QueryState {
	SEND_QUERY = 'SEND_QUERY',
	POLLING_QUERY_STATUS = 'POLLING_QUERY_STATUS',
	FETCHING_QUERY_RESULT = 'FETCHING_QUERY_RESULT',
	QUERY_SUCCESS = 'QUERY_SUCCESS',
	QUERY_ERROR = 'QUERY_ERROR',
}

export type QueryMachineState =
	| {value: QueryState.SEND_QUERY; context: QueryMachineContext}
	| {
			value: QueryState.POLLING_QUERY_STATUS;
			context: QueryMachineContext;
	  }
	| {
			value: QueryState.FETCHING_QUERY_RESULT;
			context: QueryMachineContext;
	  }
	| {
			value: QueryState.QUERY_ERROR;
			context: QueryMachineContext;
	  }
	| {
			value: QueryState.QUERY_SUCCESS;
			context: QueryMachineContext;
	  };

// Guards
const isStatusCompleted = (event: DoneInvokeEvent<RunStatusResponse>) =>
	event.data.status === 'completed';

export const sendQueryMachine = createMachine<
	QueryMachineContext,
	EventObject,
	QueryMachineState
>({
	id: 'sendQueryMachine',
	predictableActionArguments: true,
	preserveActionOrder: true,
	context: initialSendQueryMachineContext,
	initial: QueryState.SEND_QUERY,
	states: {
		[QueryState.SEND_QUERY]: {
			invoke: {
				src: context =>
					sendQuery({
						query: context.query,
						systemInstructions: context.systemInstructions,
						thread_id: context.thread_id,
					}),
				onDone: {
					target: QueryState.POLLING_QUERY_STATUS,
					actions: assign({
						run: (_, event: DoneInvokeEvent<Run>) => event.data,
					}),
				},
				onError: {
					target: QueryState.QUERY_ERROR,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
		},
		[QueryState.POLLING_QUERY_STATUS]: {
			invoke: {
				src: async context => {
					await sleep(1000);
					return await sendQueryStatus(context.run);
				},
				onDone: [
					// If status is not completed, keep polling
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							!isStatusCompleted(event),
						target: QueryState.POLLING_QUERY_STATUS,
					},
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							isStatusCompleted(event),
						target: QueryState.FETCHING_QUERY_RESULT,
					},
				],
				onError: {
					target: QueryState.QUERY_ERROR,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
		},
		[QueryState.FETCHING_QUERY_RESULT]: {
			invoke: {
				src: async context =>
					await sendQueryResult({
						thread_id: context.run.thread_id,
						responseParentKey: context.responseParentKey,
						skipTransform: context.skipTransform,
					}),
				onDone: {
					target: QueryState.QUERY_SUCCESS,
					actions: assign({
						result: (_, event: DoneInvokeEvent<string>) => event.data,
					}),
				},
				onError: {
					target: QueryState.QUERY_ERROR,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
		},
		[QueryState.QUERY_SUCCESS]: {
			type: 'final',
			data: context => ({
				run: context.run,
				result: JSON.parse(context.result),
			}),
		},
		[QueryState.QUERY_ERROR]: {
			entry: [context => console.log('QUERY_ERROR:', context.errorMessage)],
		},
	},
});
