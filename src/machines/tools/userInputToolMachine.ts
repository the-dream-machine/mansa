import {assign, createMachine, sendParent} from 'xstate';
import {ToolEvent} from '../../types/ToolMachine.js';

// Context
export interface UserInputToolMachineContext {
	answer: string;
	isSubmitted: boolean;
}

export const initialUserInputToolMachineContext: UserInputToolMachineContext = {
	answer: '',
	isSubmitted: false,
};

// Event
export enum UserInputToolEvent {
	SUBMIT_ANSWER = 'SUBMIT_ANSWER',
}

export type UserInputToolMachineEvent = {
	type: UserInputToolEvent.SUBMIT_ANSWER;
	answer: string;
};

// State
export enum UserInputToolState {
	IDLE = 'IDLE',
	FINAL = 'FINAL',
}

export type UserInputToolMachineState =
	| {
			value: UserInputToolState.IDLE;
			context: UserInputToolMachineContext;
	  }
	| {
			value: UserInputToolState.FINAL;
			context: UserInputToolMachineContext;
	  };

export const userInputToolMachine = createMachine<
	UserInputToolMachineContext,
	UserInputToolMachineEvent,
	UserInputToolMachineState
>({
	id: 'userInputToolMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	context: initialUserInputToolMachineContext,
	initial: UserInputToolState.IDLE,
	states: {
		[UserInputToolState.IDLE]: {
			on: {
				[UserInputToolEvent.SUBMIT_ANSWER]: {
					target: UserInputToolState.FINAL,
					actions: [
						assign((_, event) => ({answer: event.answer, isSubmitted: true})),
						sendParent((_, event) => ({
							type: ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT,
							output: JSON.stringify({answer: event.answer}),
						})),
					],
				},
			},
		},
		[UserInputToolState.FINAL]: {
			type: 'final',
		},
	},
});
