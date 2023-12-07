import {assign, createMachine, sendParent} from 'xstate';
import {StepsEvent} from '../types/StepsMachine.js';
import {type Static} from '@sinclair/typebox';
import {type userActionSchema} from '../utils/schema/Steps.js';
import clipboard from 'clipboardy';
import {$} from 'zx';

// Context
export interface UserActionMachineContext {
	user_action?: Static<typeof userActionSchema>;
	enterLabel: string;
	isBashCommand: boolean;
	isUrl: boolean;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	loadingMessage: string;
	successMessage: string;
	errorMessage: string;
}

// State
export enum UserActionState {
	CHECKING_ACTION_TYPE = 'CHECKING_ACTION_TYPE',

	BASH_COMMAND_IDLE = 'BASH_COMMAND_IDLE',
	COPYING_BASH_COMMAND = 'COPYING_BASH_COMMAND',
	BASH_COMMAND_SUCCESS_IDLE = 'RUN_BASH_COMMAND_SUCCESS_IDLE',

	URL_IDLE = 'URL_IDLE',
	OPENING_URL = 'OPENING_URL',
	URL_SUCCESS_IDLE = 'URL_SUCCESS_IDLE',
}

export type UserActionMachineState =
	| {
			value: UserActionState.CHECKING_ACTION_TYPE;
			context: UserActionMachineContext;
	  }
	| {
			value: UserActionState.BASH_COMMAND_IDLE;
			context: UserActionMachineContext;
	  }
	| {
			value: UserActionState.COPYING_BASH_COMMAND;
			context: UserActionMachineContext;
	  }
	| {
			value: UserActionState.BASH_COMMAND_SUCCESS_IDLE;
			context: UserActionMachineContext;
	  }
	| {value: UserActionState.URL_IDLE; context: UserActionMachineContext}
	| {value: UserActionState.OPENING_URL; context: UserActionMachineContext}
	| {
			value: UserActionState.URL_SUCCESS_IDLE;
			context: UserActionMachineContext;
	  };

// Events
export enum UserActionEvent {
	ENTER_KEY_PRESS = 'ENTER_KEY_PRESS',
}
export type UserActionMachineEvent = {type: UserActionEvent.ENTER_KEY_PRESS};

export const initialUserActionContext: UserActionMachineContext = {
	user_action: undefined,
	enterLabel: '',
	isBashCommand: false,
	isUrl: false,
	isLoading: false,
	isSuccess: false,
	isError: false,
	loadingMessage: '',
	successMessage: '',
	errorMessage: '',
};

// Guards
const isBashCommand = (context: UserActionMachineContext) =>
	!!context.user_action?.bash_command;
const isUrl = (context: UserActionMachineContext) => !!context.user_action?.url;

export const userActionMachine = createMachine<
	UserActionMachineContext,
	UserActionMachineEvent,
	UserActionMachineState
>({
	id: 'userActionMachine',
	predictableActionArguments: true,
	initial: UserActionState.CHECKING_ACTION_TYPE,
	context: initialUserActionContext,
	states: {
		[UserActionState.CHECKING_ACTION_TYPE]: {
			always: [
				{
					cond: isBashCommand,
					actions: assign({isBashCommand: true, enterLabel: 'copy command'}),
					target: UserActionState.BASH_COMMAND_IDLE,
				},
				{
					cond: isUrl,
					actions: assign({isUrl: true, enterLabel: 'open link'}),
					target: UserActionState.URL_IDLE,
				},
			],
		},
		[UserActionState.BASH_COMMAND_IDLE]: {
			on: {
				[UserActionEvent.ENTER_KEY_PRESS]: {
					target: UserActionState.COPYING_BASH_COMMAND,
				},
			},
		},
		[UserActionState.COPYING_BASH_COMMAND]: {
			invoke: {
				src: async context =>
					await clipboard.write(context.user_action?.bash_command ?? ''),
				onDone: {
					target: UserActionState.BASH_COMMAND_SUCCESS_IDLE,
				},
			},
		},
		[UserActionState.BASH_COMMAND_SUCCESS_IDLE]: {
			entry: [assign({isSuccess: true})],
			on: {
				[UserActionEvent.ENTER_KEY_PRESS]: {
					actions: sendParent({type: StepsEvent.NAVIGATE_NEXT_STEP}),
				},
			},
		},
		[UserActionState.URL_IDLE]: {
			on: {
				[UserActionEvent.ENTER_KEY_PRESS]: {
					target: UserActionState.OPENING_URL,
				},
			},
		},
		[UserActionState.OPENING_URL]: {
			invoke: {
				src: async context => {
					/**
					 * You have to pass in commands as an array
					 * @see: https://google.github.io/zx/quotes#assembling-commands
					 */
					const args = ['open', context.user_action?.url];
					await $`${args}`.quiet();
				},
				onDone: {target: UserActionState.URL_SUCCESS_IDLE},
			},
		},
		[UserActionState.URL_SUCCESS_IDLE]: {
			entry: [assign({isSuccess: true})],
			on: {
				[UserActionEvent.ENTER_KEY_PRESS]: {
					actions: sendParent({type: StepsEvent.NAVIGATE_NEXT_STEP}),
				},
			},
		},
	},
});
