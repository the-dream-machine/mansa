import {assign, createMachine} from 'xstate';
import {sendParent} from 'xstate/lib/actions.js';
import {ToolEvent} from '../../types/ToolMachine.js';

// Context
export interface UserSelectToolMachineContext {
	options: string[];
	selectedOption: string;
}

export const initialUserSelectToolMachineContext: UserSelectToolMachineContext =
	{
		options: [],
		selectedOption: '',
	};

// State
export enum UserSelectToolState {
	IDLE = 'IDLE',
	FINAL = 'FINAL',
}

export type UserSelectToolMachineState =
	| {value: UserSelectToolState.IDLE; context: UserSelectToolMachineContext}
	| {value: UserSelectToolState.FINAL; context: UserSelectToolMachineContext};

// Event
export enum UserSelectToolEvent {
	SELECT_OPTION = 'SELECT_OPTION',
}

export type UserSelectToolMachineEvent = {
	type: UserSelectToolEvent.SELECT_OPTION;
	option: string;
};

export const userSelectToolMachine = createMachine<
	UserSelectToolMachineContext,
	UserSelectToolMachineEvent,
	UserSelectToolMachineState
>({
	/** @xstate-layout N4IgpgJg5mDOIC5QFdZgE4GUwBswGMAXAFQHtScBZAQ3wAsBLAOzADoBJAEQBkBRAYky8+AYWIB9APIAFYu0kA5ANoAGALqJQAB1KwGhBqSaaQAD0QBGAEwAOVgFYbN+wBYbVlQGZPKgJwqAdgAaEABPRA8LVlsrTxcANhdfZ3t7TwBfdJDUDGw8IjIKGnpmNiFRYl5OKVl5BXEuPn5OXnLeMRq5RVUNJBAdPQMjE3MEb19WOJU3ewCXC1T3EPCEC08oizcXT18LFXj1i3ibTOy0LFwCEnIqWkYWVjaxKs66hp4BTABVACFKdgkT0q1RkXWU6hMA30hmMfVGPgCrBUFl8aRc9l8AWm9gsy0QNiinisVl8cRsqOcB3smSyICYpAgcBMOQu+WuRTupUhumhwzhiAAtPE8QghacQCy8ldCrcSg9GrxuYMYSNEC4rCLiS5WBY5r4rLMvL54ipAuLJZcCjdivcysJ2sDXop3nwlbzYaB4R5WDYVM5nElfC59jZPJr1qx1esAvF7H6bFj4jT0kA */
	id: 'userSelectToolMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	context: initialUserSelectToolMachineContext,
	initial: UserSelectToolState.IDLE,
	states: {
		[UserSelectToolState.IDLE]: {
			on: {
				[UserSelectToolEvent.SELECT_OPTION]: {
					target: UserSelectToolState.FINAL,
					actions: [
						assign({selectedOption: (_, event) => event.option}),
						sendParent((_, event) => ({
							type: ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT,
							output: JSON.stringify({selected: event.option}),
						})),
					],
				},
			},
		},
		[UserSelectToolState.FINAL]: {
			type: 'final',
		},
	},
});
