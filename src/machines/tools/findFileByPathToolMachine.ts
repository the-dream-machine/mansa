import {
	assign,
	createMachine,
	sendParent,
	type DoneInvokeEvent,
	type EventObject,
} from 'xstate';
import {fs} from 'zx';
import {ToolEvent} from '../../types/ToolMachine.js';

// Context
export interface FindFileByPathToolMachineContext {
	filePath: string;
	fileExists: boolean;
}

export const initialFindFileByPathToolMachineContext: FindFileByPathToolMachineContext =
	{
		filePath: '',
		fileExists: false,
	};

// Event
export type FindFileByPathToolMachineEvent = EventObject;

// State
export enum FindFileByPathToolState {
	SEARCHING_FOR_FILE = 'SEARCHING_FOR_FILE',
}

export type FindFileByPathToolMachineState = {
	value: FindFileByPathToolState.SEARCHING_FOR_FILE;
	context: FindFileByPathToolMachineContext;
};

export const findFileByPathToolMachine = createMachine<
	FindFileByPathToolMachineContext,
	FindFileByPathToolMachineEvent,
	FindFileByPathToolMachineState
>({
	id: 'findFileByPathToolMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	context: initialFindFileByPathToolMachineContext,
	initial: FindFileByPathToolState.SEARCHING_FOR_FILE,
	states: {
		[FindFileByPathToolState.SEARCHING_FOR_FILE]: {
			invoke: {
				src: async context => await fs.exists(context.filePath),
				onDone: {
					actions: [
						assign({
							fileExists: (_, event: DoneInvokeEvent<boolean>) => event.data,
						}),
						sendParent((_, event: DoneInvokeEvent<boolean>) => ({
							type: ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT,
							output: JSON.stringify({does_file_exist: event.data}),
						})),
					],
				},
			},
		},
	},
});
