import {fs} from 'zx';
import * as prettier from 'prettier';
import {createMachine, assign, type DoneInvokeEvent} from 'xstate';

import {generateFileEdits} from '../utils/api/generateFileEdits.js';

// Context
export interface ModifyFileMachineContext {
	filePath?: string;
	fileExtension?: string;
	fileSummary?: string;
	fileChangesSummary?: string;
	rawCode?: string;
	formattedRawCode?: string;
	highlightedCode?: string;
	enterLabel: string;
}

// States
export enum ModifyFileState {
	READING_RAW_FILE = 'READING_RAW_FILE',
	FORMATTING_RAW_CODE = 'FORMATTING_RAW_CODE',
	IDLE = 'IDLE',
	FETCHING_FILE_EDITS = 'FETCHING_FILE_EDITS',
	FETCHING_FILE_EDITS_SUCCESS_IDLE = 'FETCHING_FILE_EDITS_SUCCESS_IDLE',
	FETCHING_FILE_EDITS_ERROR_IDLE = 'FETCHING_FILE_EDITS_ERROR_IDLE',
	FORMATTING_CODE = 'FORMATTING_CODE',
	HIGHLIGHTING_CODE = 'HIGHLIGHTING_CODE',
	HIGHLIGHTING_UNSUPPORTED_CODE = 'HIGHLIGHTING_UNSUPPORTED_CODE',
	WRITING_FILE_EDITS = 'WRITING_FILE_EDITS',
	WRITING_FILE_EDITS_SUCCESS_IDLE = 'WRITING_FILE_EDITS_SUCCESS_IDLE',
	WRITING_FILE_EDITS_ERROR_IDLE = 'WRITING_FILE_EDITS_ERROR_IDLE',
}

//  State machine states
export type ModifyFileMachineState =
	| {
			value: ModifyFileState.READING_RAW_FILE;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.FORMATTING_RAW_CODE;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.IDLE;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.FETCHING_FILE_EDITS;
			context: ModifyFileMachineContext;
	  };

export enum ModifyFileEvent {
	ENTER_PRESSED = 'ENTER_PRESSED',
}

//  State machine events
export type ModifyFileMachineEvent = {type: ModifyFileEvent.ENTER_PRESSED};

export const modifyFileMachine = createMachine<
	ModifyFileMachineContext,
	ModifyFileMachineEvent,
	ModifyFileMachineState
>({
	id: 'modifyFileMachine',
	predictableActionArguments: true,
	initial: ModifyFileState.READING_RAW_FILE,
	context: {
		filePath: '',
		fileExtension: '',
		fileSummary: '',
		fileChangesSummary: '',
		rawCode: '',
		formattedRawCode: '',
		highlightedCode: '',
		enterLabel: '',
	},
	states: {
		[ModifyFileState.READING_RAW_FILE]: {
			invoke: {
				src: async context =>
					(await fs.readFile(context.filePath ?? '')).toString(),
				onDone: {
					target: ModifyFileState.FORMATTING_RAW_CODE,
					actions: assign({
						rawCode: (_, event: DoneInvokeEvent<string>) => event.data,
					}),
				},
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log('ERROR: ', event.data.message),
				},
			},
		},
		[ModifyFileState.FORMATTING_RAW_CODE]: {
			invoke: {
				src: async context =>
					await prettier.format(context.rawCode ?? '', {
						filepath: context.filePath,
					}),
				onDone: {
					target: ModifyFileState.IDLE,
					actions: assign({
						formattedRawCode: (_, event: DoneInvokeEvent<string>) => event.data,
					}),
				},
				onError: {
					target: ModifyFileState.IDLE,
					actions: assign({
						formattedRawCode: context => context.rawCode,
					}),
				},
			},
		},
		[ModifyFileState.IDLE]: {
			on: {
				[ModifyFileEvent.ENTER_PRESSED]: {
					target: ModifyFileState.FETCHING_FILE_EDITS,
				},
			},
		},

		[ModifyFileState.FETCHING_FILE_EDITS]: {
			invoke: {
				src: async context => {
					context.filePath;
					return await generateFileEdits({
						filePath: context.filePath ?? '',
						fileContent: context.formattedRawCode ?? '',
						fileSummary: context.fileSummary ?? '',
						fileChangesSummary: context.fileChangesSummary ?? '',
					});
				},
			},
		},
	},
});
