import {createMachine, assign, type DoneInvokeEvent} from 'xstate';

import * as prettier from 'prettier';
import {highlightAsync} from '../utils/highlightAsync.js';
import loadLanguages from 'prismjs/components/index.js';

// Context
export interface CreateFileMachineContext {
	filePath: string;
	fileExtension: string;
	rawCode: string;
	formattedCode: string;
	highlightedCode: string;
	enterLabel: string;
}

// States
export enum CreateFileState {
	WAITING_CONTEXT_UPDATE = 'WAITING_CONTEXT_UPDATE',
	FORMATTING_CODE = 'FORMATTING_CODE',
	HIGHLIGHTING_CODE = 'HIGHLIGHTING_CODE',
	HIGHLIGHTING_UNSUPPORTED_CODE = 'HIGHLIGHTING_UNSUPPORTED_CODE',
	IDLE = 'IDLE',
}

//  State machine states
export type CreateFileMachineState =
	| {
			value: CreateFileState.WAITING_CONTEXT_UPDATE;
			context: CreateFileMachineContext;
	  }
	| {value: CreateFileState.FORMATTING_CODE; context: CreateFileMachineContext}
	| {
			value: CreateFileState.HIGHLIGHTING_CODE;
			context: CreateFileMachineContext;
	  }
	| {
			value: CreateFileState.HIGHLIGHTING_UNSUPPORTED_CODE;
			context: CreateFileMachineContext;
	  }
	| {value: CreateFileState.IDLE; context: CreateFileMachineContext};

export enum CreateFileEvent {
	ENTER_PRESSED = 'ENTER_PRESSED',
	UPDATE_CONTEXT = 'UPDATE_CONTEXT',
}

//  State machine events
export type CreateFileMachineEvent =
	| {type: CreateFileEvent.ENTER_PRESSED}
	| {
			type: CreateFileEvent.UPDATE_CONTEXT;
			ctx: Pick<
				CreateFileMachineContext,
				'rawCode' | 'filePath' | 'fileExtension'
			>;
	  };

export const createFileMachine = createMachine<
	CreateFileMachineContext,
	CreateFileMachineEvent,
	CreateFileMachineState
>({
	id: 'createFileMachine',
	predictableActionArguments: true,
	initial: CreateFileState.FORMATTING_CODE,
	context: {
		filePath: '',
		fileExtension: '',
		rawCode: '',
		formattedCode: '',
		highlightedCode: '',
		enterLabel: 'create file',
	},
	states: {
		[CreateFileState.WAITING_CONTEXT_UPDATE]: {
			on: {
				[CreateFileEvent.UPDATE_CONTEXT]: {
					target: CreateFileState.FORMATTING_CODE,
					actions: assign({
						filePath: (_, event) => event.ctx.filePath,
						fileExtension: (_, event) => event.ctx.fileExtension,
						rawCode: (_, event) => event.ctx.rawCode,
					}),
				},
			},
		},
		[CreateFileState.FORMATTING_CODE]: {
			invoke: {
				src: async context =>
					await prettier.format(context.rawCode, {
						filepath: context.filePath,
					}),
				onDone: {
					target: CreateFileState.HIGHLIGHTING_CODE,
					actions: assign({
						formattedCode: (_, event: DoneInvokeEvent<string>) => event.data,
					}),
				},
				onError: {
					target: CreateFileState.HIGHLIGHTING_CODE,
					actions: assign({
						formattedCode: context => context.rawCode,
					}),
				},
			},
		},
		[CreateFileState.HIGHLIGHTING_CODE]: {
			invoke: {
				src: async context => {
					loadLanguages(context.fileExtension);
					return await highlightAsync({
						code: context.formattedCode,
						language: context.fileExtension,
					});
				},
				onDone: {
					target: CreateFileState.IDLE,
					actions: assign({
						highlightedCode: (_, event: DoneInvokeEvent<string>) => event.data,
					}),
				},
				onError: {
					target: CreateFileState.HIGHLIGHTING_UNSUPPORTED_CODE,
				},
			},
		},
		[CreateFileState.HIGHLIGHTING_UNSUPPORTED_CODE]: {
			invoke: {
				src: async context =>
					await highlightAsync({code: context.formattedCode, language: 'tsx'}),
				onDone: {
					target: CreateFileState.IDLE,
					actions: assign({
						highlightedCode: (_, event: DoneInvokeEvent<string>) => event.data,
					}),
				},
				onError: {
					target: CreateFileState.IDLE,
					actions: assign({
						highlightedCode: context => context.formattedCode,
					}),
				},
			},
		},
		[CreateFileState.IDLE]: {},
	},
});
