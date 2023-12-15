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
export interface ReadFileMachineContext {
	toolCallId: string;
	filePath: string;
}

export const initialReadFileMachineContext: ReadFileMachineContext = {
	toolCallId: '',
	filePath: '',
};

// State
export enum ReadFileState {
	READING_FILE = 'READING_FILE',
}

export type ReadFileMachineState = {
	value: ReadFileState.READING_FILE;
	context: ReadFileMachineContext;
};

export const readFileMachine = createMachine<
	ReadFileMachineContext,
	EventObject,
	ReadFileMachineState
>({
	id: 'readFileMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	context: initialReadFileMachineContext,
	initial: ReadFileState.READING_FILE,
	states: {
		[ReadFileState.READING_FILE]: {
			entry: [
				sendParent(context => ({
					type: ChatEvent.ADD_MESSAGE,
					message: {
						id: uuid(),
						text: `Reading ${context.filePath}`,
						isReadFile: true,
					},
				})),
			],
			invoke: {
				src: async context => (await fs.readFile(context.filePath)).toString(),
				onDone: {
					actions: sendParent((context, event: DoneInvokeEvent<string>) => ({
						type: ChatEvent.SUBMIT_TOOL_OUTPUT,
						toolOutput: {
							tool_call_id: context.toolCallId,
							output: JSON.stringify({file_content: event.data}),
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
