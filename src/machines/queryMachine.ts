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

// Context
export interface QueryMachineContext {
	query: string;
	run: Run;
	errorMessage?: string;
	result: string;
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

const initialContext: QueryMachineContext = {
	query: '',
	run: {thread_id: '', run_id: ''},
	errorMessage: '',
	result: '',
};

export const queryMachine = createMachine<
	QueryMachineContext,
	EventObject,
	QueryMachineState
>({
	id: 'queryMachine',
	predictableActionArguments: true,
	preserveActionOrder: true,
	context: initialContext,
	initial: QueryState.SEND_QUERY,
	states: {
		[QueryState.SEND_QUERY]: {
			invoke: {
				src: async context => await sendQuery({query: context.query}),
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
				src: async context => await sendQueryResult(context.run),
				onDone: {
					// actions: {type: },
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
		[QueryState.QUERY_SUCCESS]: {},
		[QueryState.QUERY_ERROR]: {},
	},
});
