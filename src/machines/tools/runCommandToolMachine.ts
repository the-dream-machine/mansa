import {$} from 'zx';
import {createMachine, assign, type DoneInvokeEvent, type Sender} from 'xstate';

import {highlightAsync} from '../../utils/highlightAsync.js';
import loadLanguages from 'prismjs/components/index.js';
import {highlight} from 'prismjs-terminal';
import {defaultPrismTheme} from '../../utils/prismThemes.js';
import {sendParent} from 'xstate/lib/actions.js';
import {ToolEvent} from '../../types/ToolMachine.js';

// Context
export interface RunCommandToolMachineContext {
	command: string;
	highlightedCommand: string;
	commandOutput: string;
	highlightedCommandOutput: string;
	showLogs: boolean;
	enterLabel: 'run command' | 'next step' | 'retry';
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	errorMessage: string;
}

export const initialRunCommandToolMachineContext: RunCommandToolMachineContext =
	{
		command: '',
		highlightedCommand: '',
		commandOutput: '',
		highlightedCommandOutput: '',
		showLogs: false,
		enterLabel: 'run command',
		isLoading: false,
		isSuccess: false,
		isError: false,
		errorMessage: '',
	};

// Event
export enum RunCommandToolEvent {
	ENTER_KEY_PRESS = 'ENTER_KEY_PRESS',
	UPDATE_COMMAND_OUTPUT = 'UPDATE_COMMAND_OUTPUT',
	GO_TO_SUCCESS_STATE = 'GO_TO_SUCCESS_STATE',
}

export type RunCommandToolMachineEvent =
	| {type: RunCommandToolEvent.ENTER_KEY_PRESS}
	| {type: RunCommandToolEvent.UPDATE_COMMAND_OUTPUT; output: string}
	| {type: RunCommandToolEvent.GO_TO_SUCCESS_STATE};

// State
export enum RunCommandToolState {
	HIGHLIGHTING_COMMAND = 'HIGHLIGHTING_COMMAND',
	IDLE = 'IDLE',
	RUNNING_COMMAND = 'RUNNING_COMMAND',
	SUCCESS_IDLE = 'SUCCESS_IDLE',
	ERROR_IDLE = 'ERROR_IDLE',
	FINAL = 'FINAL',
}

export type RunCommandToolMachineState =
	| {
			value: RunCommandToolState.HIGHLIGHTING_COMMAND;
			context: RunCommandToolMachineContext;
	  }
	| {
			value: RunCommandToolState.IDLE;
			context: RunCommandToolMachineContext;
	  }
	| {
			value: RunCommandToolState.RUNNING_COMMAND;
			context: RunCommandToolMachineContext;
	  }
	| {
			value: RunCommandToolState.SUCCESS_IDLE;
			context: RunCommandToolMachineContext;
	  }
	| {
			value: RunCommandToolState.ERROR_IDLE;
			context: RunCommandToolMachineContext;
	  }
	| {
			value: RunCommandToolState.FINAL;
			context: RunCommandToolMachineContext;
	  };

loadLanguages('bash');
loadLanguages('log');

export const runCommandToolMachine = createMachine<
	RunCommandToolMachineContext,
	RunCommandToolMachineEvent,
	RunCommandToolMachineState
>({
	id: 'runCommandToolMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	initial: RunCommandToolState.HIGHLIGHTING_COMMAND,
	context: initialRunCommandToolMachineContext,
	states: {
		[RunCommandToolState.HIGHLIGHTING_COMMAND]: {
			invoke: {
				src: async context =>
					await highlightAsync({
						code: context.command,
						language: 'bash',
					}),

				onDone: {
					target: RunCommandToolState.IDLE,
					actions: assign({
						highlightedCommand: (_, event: DoneInvokeEvent<string>) =>
							event.data,
					}),
				},
			},
		},
		[RunCommandToolState.IDLE]: {
			on: {
				[RunCommandToolEvent.ENTER_KEY_PRESS]: {
					target: RunCommandToolState.RUNNING_COMMAND,
				},
			},
		},
		[RunCommandToolState.RUNNING_COMMAND]: {
			entry: [assign({isLoading: true, showLogs: true})],
			on: {
				[RunCommandToolEvent.UPDATE_COMMAND_OUTPUT]: {
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
				[RunCommandToolEvent.GO_TO_SUCCESS_STATE]: {
					target: RunCommandToolState.SUCCESS_IDLE,
				},
			},
			invoke: {
				src: context => (send: Sender<RunCommandToolMachineEvent>) => {
					/**
					 * You have to pass in commands as an array
					 * @see: https://google.github.io/zx/quotes#assembling-commands
					 */
					const args = context.command.split(' ');
					const process = $`${args}`.quiet();

					process.stdout.on('data', (data: Buffer) => {
						send({
							type: RunCommandToolEvent.UPDATE_COMMAND_OUTPUT,
							output: data.toString(),
						});
					});

					process.stdout.on('error', _ => {
						throw new Error('Failed to run command');
					});

					process.stdout.on('end', () => {
						send({
							type: RunCommandToolEvent.GO_TO_SUCCESS_STATE,
						});
					});
				},
				onError: {
					target: RunCommandToolState.ERROR_IDLE,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
			exit: [
				assign({isLoading: initialRunCommandToolMachineContext.isLoading}),
			],
		},
		[RunCommandToolState.SUCCESS_IDLE]: {
			entry: [assign({isSuccess: true, enterLabel: 'next step'})],
			on: {
				[RunCommandToolEvent.ENTER_KEY_PRESS]: {
					target: RunCommandToolState.FINAL,
					actions: sendParent({
						type: ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT,
						output: JSON.stringify({response: 'success'}),
					}),
				},
			},
		},
		[RunCommandToolState.ERROR_IDLE]: {
			entry: [assign({isError: true, enterLabel: 'retry'})],
			on: {
				[RunCommandToolEvent.ENTER_KEY_PRESS]: {
					target: RunCommandToolState.RUNNING_COMMAND,
				},
			},
			exit: [
				assign({
					isError: initialRunCommandToolMachineContext.isError,
					enterLabel: initialRunCommandToolMachineContext.enterLabel,
				}),
			],
		},
		[RunCommandToolState.FINAL]: {
			type: 'final',
		},
	},
});
