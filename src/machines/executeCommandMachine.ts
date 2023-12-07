import {$} from 'zx';
import {createMachine, assign, type DoneInvokeEvent, type Sender} from 'xstate';

import {highlightAsync} from '../utils/highlightAsync.js';
import loadLanguages from 'prismjs/components/index.js';
import {highlight} from 'prismjs-terminal';
import {defaultPrismTheme} from '../utils/prismThemes.js';
import {sendParent} from 'xstate/lib/actions.js';
import {StepsEvent} from '../types/StepsMachine.js';

// Context
export interface ExecuteCommandMachineContext {
	enterLabel: 'run command' | 'next step' | 'retry';
	bashCommand: string;
	highlightedBashCommand: string;
	commandOutput: string;
	highlightedCommandOutput: string;

	showLogsSection: boolean;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	errorMessage: string;
}
export const initialExecuteCommandMachineContext: ExecuteCommandMachineContext =
	{
		enterLabel: 'run command',
		bashCommand: '',
		highlightedBashCommand: '',
		commandOutput: '',
		highlightedCommandOutput: '',
		showLogsSection: false,
		isLoading: false,
		isSuccess: false,
		isError: false,
		errorMessage: '',
	};

// States
export enum ExecuteCommandState {
	HIGHLIGHTING_BASH_COMMAND = 'HIGHLIGHTING_BASH_COMMAND',
	IDLE = 'IDLE',
	RUNNING_BASH_COMMAND = 'RUNNING_BASH_COMMAND',
	RUNNING_BASH_COMMAND_SUCCESS_IDLE = 'RUNNING_BASH_COMMAND_SUCCESS_IDLE',
	RUNNING_BASH_COMMAND_ERROR_IDLE = 'RUNNING_BASH_COMMAND_ERROR_IDLE',
}

//  State machine states
export type ExecuteCommandMachineState =
	| {
			value: ExecuteCommandState.HIGHLIGHTING_BASH_COMMAND;
			context: ExecuteCommandMachineContext;
	  }
	| {
			value: ExecuteCommandState.IDLE;
			context: ExecuteCommandMachineContext;
	  }
	| {
			value: ExecuteCommandState.RUNNING_BASH_COMMAND;
			context: ExecuteCommandMachineContext;
	  }
	| {
			value: ExecuteCommandState.RUNNING_BASH_COMMAND_SUCCESS_IDLE;
			context: ExecuteCommandMachineContext;
	  }
	| {
			value: ExecuteCommandState.RUNNING_BASH_COMMAND_ERROR_IDLE;
			context: ExecuteCommandMachineContext;
	  };

export enum ExecuteCommandEvent {
	ENTER_KEY_PRESSED = 'ENTER_KEY_PRESSED',
	UPDATE_COMMAND_OUTPUT = 'UPDATE_COMMAND_OUTPUT',
	GO_TO_SUCCESS_STATE = 'GO_TO_SUCCESS_STATE',
}

//  State machine events
export type ExecuteCommandMachineEvent =
	| {type: ExecuteCommandEvent.ENTER_KEY_PRESSED}
	| {type: ExecuteCommandEvent.UPDATE_COMMAND_OUTPUT; output: string}
	| {type: ExecuteCommandEvent.GO_TO_SUCCESS_STATE};

export const executeCommandMachine = createMachine<
	ExecuteCommandMachineContext,
	ExecuteCommandMachineEvent,
	ExecuteCommandMachineState
>({
	id: 'executeCommandMachine',
	predictableActionArguments: true,
	initial: ExecuteCommandState.HIGHLIGHTING_BASH_COMMAND,
	context: initialExecuteCommandMachineContext,
	states: {
		[ExecuteCommandState.HIGHLIGHTING_BASH_COMMAND]: {
			invoke: {
				src: async context => {
					loadLanguages('bash');
					return await highlightAsync({
						code: context.bashCommand.trim(),
						language: 'bash',
					});
				},
				onDone: {
					target: ExecuteCommandState.IDLE,
					actions: assign({
						highlightedBashCommand: (_, event: DoneInvokeEvent<string>) =>
							event.data,
					}),
				},
			},
		},
		[ExecuteCommandState.IDLE]: {
			on: {
				[ExecuteCommandEvent.ENTER_KEY_PRESSED]: {
					target: ExecuteCommandState.RUNNING_BASH_COMMAND,
				},
			},
		},
		[ExecuteCommandState.RUNNING_BASH_COMMAND]: {
			entry: [assign({isLoading: true, showLogsSection: true})],
			on: {
				[ExecuteCommandEvent.UPDATE_COMMAND_OUTPUT]: {
					actions: assign({
						highlightedCommandOutput: (context, event) => {
							loadLanguages('log');
							const currentHighlightedCommandOutput = highlight(event.output, {
								language: 'log',
								theme: defaultPrismTheme({}),
							});

							return context.highlightedCommandOutput
								.concat('\n')
								.concat(currentHighlightedCommandOutput);
						},
					}),
				},
				[ExecuteCommandEvent.GO_TO_SUCCESS_STATE]: {
					target: ExecuteCommandState.RUNNING_BASH_COMMAND_SUCCESS_IDLE,
				},
			},
			invoke: {
				src: context => (send: Sender<ExecuteCommandMachineEvent>) => {
					/**
					 * You have to pass in commands as an array
					 * @see: https://google.github.io/zx/quotes#assembling-commands
					 */
					const args = context.bashCommand.split(' ');
					const process = $`${args}`.quiet();

					process.stdout.on('data', (data: Buffer) => {
						send({
							type: ExecuteCommandEvent.UPDATE_COMMAND_OUTPUT,
							output: data.toString(),
						});
					});
					process.stdout.on('error', _ => {
						throw new Error('Failed to run command');
					});

					process.stdout.on('end', () => {
						send({
							type: ExecuteCommandEvent.GO_TO_SUCCESS_STATE,
						});
					});
				},
				onError: {
					target: ExecuteCommandState.RUNNING_BASH_COMMAND_ERROR_IDLE,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
			exit: [
				assign({isLoading: initialExecuteCommandMachineContext.isLoading}),
			],
		},
		[ExecuteCommandState.RUNNING_BASH_COMMAND_SUCCESS_IDLE]: {
			entry: [assign({isSuccess: true, enterLabel: 'next step'})],
			on: {
				[ExecuteCommandEvent.ENTER_KEY_PRESSED]: {
					actions: [sendParent({type: StepsEvent.NAVIGATE_NEXT_STEP})],
				},
			},
			exit: [
				assign({
					isSuccess: initialExecuteCommandMachineContext.isSuccess,
					enterLabel: initialExecuteCommandMachineContext.enterLabel,
				}),
			],
		},
		[ExecuteCommandState.RUNNING_BASH_COMMAND_ERROR_IDLE]: {
			entry: [assign({isError: true, enterLabel: 'retry'})],
			on: {
				[ExecuteCommandEvent.ENTER_KEY_PRESSED]: {
					target: ExecuteCommandState.RUNNING_BASH_COMMAND,
				},
			},
			exit: [
				assign({
					isError: initialExecuteCommandMachineContext.isError,
					enterLabel: initialExecuteCommandMachineContext.enterLabel,
				}),
			],
		},
	},
});
