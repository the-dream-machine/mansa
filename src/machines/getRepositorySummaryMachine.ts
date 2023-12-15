import {
	createMachine,
	sendParent,
	type EventObject,
	type DoneInvokeEvent,
} from 'xstate';
import {v4 as uuid} from 'uuid';

import {getRepositoryMap} from '../utils/repository/getRepositoryMap.js';
import {ChatEvent} from '../types/ChatMachine.js';
import {getRepositoryConfig} from '../utils/repository/getRepositoryConfig.js';

// Context
export interface GetRepositorySummaryMachineContext {
	toolCallId: string;
}

export const initialGetRepositorySummaryContext: GetRepositorySummaryMachineContext =
	{toolCallId: ''};

// State
export enum GetRepositorySummaryState {
	FETCHING_REPOSITORY_SUMMARY = 'FETCHING_REPOSITORY_SUMMARY',
}

export type GetRepositorySummaryMachineState = {
	value: GetRepositorySummaryState.FETCHING_REPOSITORY_SUMMARY;
	context: GetRepositorySummaryMachineContext;
};

export const getRepositorySummaryMachine = createMachine<
	GetRepositorySummaryMachineContext,
	EventObject,
	GetRepositorySummaryMachineState
>({
	id: 'getRepositorySummaryMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	context: initialGetRepositorySummaryContext,
	initial: GetRepositorySummaryState.FETCHING_REPOSITORY_SUMMARY,
	states: {
		[GetRepositorySummaryState.FETCHING_REPOSITORY_SUMMARY]: {
			entry: [
				sendParent(() => ({
					type: ChatEvent.ADD_MESSAGE,
					message: {
						id: uuid(),
						text: 'Reading repository metadata',
						isGetRepositorySummary: true,
					},
				})),
			],
			invoke: {
				src: async () => {
					const config = await getRepositoryConfig();
					const repositoryMap = await getRepositoryMap();
					const packageJsonMapItem = repositoryMap.find(
						mapItem => mapItem.filePath === 'package.json',
					);
					return `${packageJsonMapItem?.fileSummary} The project uses the '${config.packageManager}' package manger.`;
				},
				onDone: {
					actions: sendParent((context, event: DoneInvokeEvent<string>) => ({
						type: ChatEvent.SUBMIT_TOOL_OUTPUT,
						toolOutput: {
							tool_call_id: context.toolCallId,
							output: JSON.stringify({summary: event.data}),
						},
					})),
				},
				onError: {
					actions: sendParent((context, event: DoneInvokeEvent<Error>) => ({
						type: ChatEvent.SUBMIT_TOOL_OUTPUT,
						toolOutput: {
							tool_call_id: context.toolCallId,
							output: JSON.stringify({error: event.data}),
						},
					})),
				},
			},
		},
	},
});
