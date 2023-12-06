import {createMachine, sendParent} from 'xstate';
import {StepsEvent} from '../types/StepsMachine.js';

// Context
export interface UserActionMachineContext {
	enterLabel: string;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	loadingMessage: string;
	successMessage: string;
	errorMessage: string;
}

// State
export enum UserActionState {
	IDLE = 'IDLE',
	SUCCESS_IDLE = 'SUCCESS_IDLE',
}

export type UserActionMachineState =
	| {
			value: UserActionState.IDLE;
			context: UserActionMachineContext;
	  }
	| {value: UserActionState.SUCCESS_IDLE; context: UserActionMachineContext};

// Events
export enum UserActionEvent {
	ENTER_KEY_PRESS = 'ENTER_KEY_PRESS',
}
export type UserActionMachineEvent = {type: UserActionEvent.ENTER_KEY_PRESS};

export const initialUserActionContext: UserActionMachineContext = {
	enterLabel: 'copy command',
	isLoading: false,
	isSuccess: false,
	isError: false,
	loadingMessage: '',
	successMessage: '',
	errorMessage: '',
};

export const userActionMachine = createMachine<
	UserActionMachineContext,
	UserActionMachineEvent,
	UserActionMachineState
>({
	id: 'userActionMachine',
	predictableActionArguments: true,
	initial: UserActionState.IDLE,
	context: initialUserActionContext,
	states: {
		[UserActionState.IDLE]: {
			on: {
				[UserActionEvent.ENTER_KEY_PRESS]: {
					target: UserActionState.SUCCESS_IDLE,
				},
			},
		},
		[UserActionState.SUCCESS_IDLE]: {
			on: {
				[UserActionEvent.ENTER_KEY_PRESS]: {
					actions: sendParent({type: StepsEvent.NAVIGATE_NEXT_STEP}),
				},
			},
		},
	},
});
