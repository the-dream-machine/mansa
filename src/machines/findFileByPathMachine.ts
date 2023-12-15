import {
	createMachine,
	sendParent,
	type EventObject,
	type DoneInvokeEvent,
} from 'xstate';
import {v4 as uuid} from 'uuid';
import {fs} from 'zx';

import {ChatEvent} from '../types/ChatMachine.js';

// Context
export interface FindFileByPathMachineContext {
	toolCallId: string;
	filePath: string;
}

export const initialFindFileByPathContext: FindFileByPathMachineContext = {
	toolCallId: '',
	filePath: '',
};

// State
export enum FindFileByPathState {
	SEARCHING_FOR_FILE_PATH = 'SEARCHING_FOR_FILE_PATH',
}

export type FindFileByPathMachineState = {
	value: FindFileByPathState.SEARCHING_FOR_FILE_PATH;
	context: FindFileByPathMachineContext;
};

export const findFileByPathMachine = createMachine<
	FindFileByPathMachineContext,
	EventObject,
	FindFileByPathMachineState
>({
	id: 'findFileByPathMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	context: initialFindFileByPathContext,
	initial: FindFileByPathState.SEARCHING_FOR_FILE_PATH,
	states: {
		[FindFileByPathState.SEARCHING_FOR_FILE_PATH]: {
			entry: [
				sendParent(context => ({
					type: ChatEvent.ADD_MESSAGE,
					message: {
						id: uuid(),
						text: `Searching for ${context.filePath}`,
						isFindFileByPath: true,
					},
				})),
			],
			invoke: {
				src: async context => await fs.exists(context.filePath),
				onDone: {
					actions: sendParent((context, event: DoneInvokeEvent<boolean>) => ({
						type: ChatEvent.SUBMIT_TOOL_OUTPUT,
						toolOutput: {
							tool_call_id: context.toolCallId,
							output: JSON.stringify({does_file_exist: event.data}),
						},
					})),
				},
			},
		},
	},
});
