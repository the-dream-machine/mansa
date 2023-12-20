import {createMachine, sendParent, type DoneInvokeEvent, assign} from 'xstate';
import {fs, sleep} from 'zx';
import {ToolEvent} from '../../types/ToolMachine.js';

// Context
export interface ReadFileToolMachineContext {
	filePath: string;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	errorMessage: string;
}

export const initialReadFileToolMachineContext: ReadFileToolMachineContext = {
	filePath: '',
	isLoading: false,
	isSuccess: false,
	isError: false,
	errorMessage: '',
};

// State
export enum ReadFileToolState {
	READING_FILE = 'READING_FILE',
	FINAL = 'FINAL',
	ERROR_IDLE = 'ERROR_IDLE',
}

export type ReadFileToolMachineState =
	| {
			value: ReadFileToolState.READING_FILE;
			context: ReadFileToolMachineContext;
	  }
	| {
			value: ReadFileToolState.ERROR_IDLE;
			context: ReadFileToolMachineContext;
	  }
	| {
			value: ReadFileToolState.FINAL;
			context: ReadFileToolMachineContext;
	  };

// Event
export enum ReadFileToolEvent {
	ENTER_KEY_PRESS = 'ENTER_KEY_PRESS',
}

export type ReadFileToolMachineEvent = {
	type: ReadFileToolEvent.ENTER_KEY_PRESS;
};

export const readFileToolMachine = createMachine<
	ReadFileToolMachineContext,
	ReadFileToolMachineEvent,
	ReadFileToolMachineState
>({
	id: 'readFileToolMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	context: initialReadFileToolMachineContext,
	initial: ReadFileToolState.READING_FILE,
	states: {
		[ReadFileToolState.READING_FILE]: {
			entry: [assign({isLoading: true})],
			invoke: {
				src: async context => {
					await sleep(1500);
					return (await fs.readFile(context.filePath)).toString();
				},
				onDone: {
					actions: [
						assign({isSuccess: true}),
						sendParent((_, event: DoneInvokeEvent<string>) => ({
							type: ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT,
							output: JSON.stringify({file_content: event.data}),
						})),
					],
					target: ReadFileToolState.FINAL,
				},
				onError: {
					target: ReadFileToolState.ERROR_IDLE,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
			exit: [assign({isLoading: false})],
		},
		[ReadFileToolState.ERROR_IDLE]: {
			entry: [assign({isError: true})],
			on: {
				[ReadFileToolEvent.ENTER_KEY_PRESS]: {
					target: ReadFileToolState.READING_FILE,
				},
			},
			exit: [assign({isError: false})],
		},
		[ReadFileToolState.FINAL]: {
			type: 'final',
		},
	},
});
