import {assign, createMachine, sendParent} from 'xstate';
import clipboard from 'clipboardy';
import {ToolEvent} from '../../types/ToolMachine.js';

// Context
export interface UserActionToolMachineContext {
	actionItem: string;
	isSuccess: boolean;
}

export const initialUserActionToolContext: UserActionToolMachineContext = {
	actionItem: '',
	isSuccess: false,
};

// State
export enum UserActionToolState {
	IDLE = 'IDLE',
	SUCCESS_IDLE = 'SUCCESS_IDLE',
	FINAL = 'FINAL',
}

export type UserActionToolMachineState = {
	value: keyof typeof UserActionToolState;
	context: UserActionToolMachineContext;
};

// Events
export enum UserActionToolEvent {
	ENTER_KEY_PRESS = 'ENTER_KEY_PRESS',
}

export type UserActionToolMachineEvent = {
	type: UserActionToolEvent.ENTER_KEY_PRESS;
};

export const userActionToolMachine = createMachine<
	UserActionToolMachineContext,
	UserActionToolMachineEvent,
	UserActionToolMachineState
>({
	id: 'userActionToolMachine',
	predictableActionArguments: true,
	initial: UserActionToolState.IDLE,
	context: initialUserActionToolContext,
	states: {
		[UserActionToolState.IDLE]: {
			on: {
				[UserActionToolEvent.ENTER_KEY_PRESS]: {
					target: UserActionToolState.SUCCESS_IDLE,
					actions: [context => clipboard.writeSync(context.actionItem)],
				},
			},
		},
		[UserActionToolState.SUCCESS_IDLE]: {
			entry: [assign({isSuccess: true})],
			on: {
				[UserActionToolEvent.ENTER_KEY_PRESS]: {
					target: UserActionToolState.FINAL,
					actions: [
						assign({isSuccess: true}),
						sendParent({
							type: ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT,
							output: JSON.stringify({response: 'completed'}),
						}),
					],
				},
			},
			exit: [assign({isSuccess: false})],
		},
		[UserActionToolState.FINAL]: {
			type: 'final',
		},
	},
});
