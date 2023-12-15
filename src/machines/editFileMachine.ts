import {createMachine, assign, type DoneInvokeEvent} from 'xstate';

import {highlightAsync} from '../utils/highlightAsync.js';
import loadLanguages from 'prismjs/components/index.js';
import {writeToFile} from '../utils/writeToFile.js';
import {sendParent} from 'xstate/lib/actions.js';
import {chalk, fs, sleep} from 'zx';

import {v4 as uuid} from 'uuid';
import {ChatEvent} from '../types/ChatMachine.js';
import {getDiffsAsync} from '../utils/getDiffsAsync.js';
import {type Change} from 'diff';
import {Colors} from '../styles/Colors.js';

// Context
export interface EditFileMachineContext {
	toolCallId: string;
	originalFileContent: string;
	filePath: string;
	fileExtension: string;
	fileContent?: string;
	diffs: Change[];
	currentDiffHighlightingIndex: number;
	formattedCode?: string;
	highlightedCode?: string;
	enterLabel: string;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	showSuccessSection: boolean;
}

export const initialEditFileMachineContext: EditFileMachineContext = {
	toolCallId: '',
	filePath: '',
	originalFileContent: '',
	fileContent: '',
	diffs: [],
	currentDiffHighlightingIndex: 0,
	fileExtension: '',
	formattedCode: '',
	highlightedCode: '',
	enterLabel: 'edit file',
	isLoading: false,
	isSuccess: false,
	isError: false,
	showSuccessSection: false,
};

// States
export enum EditFileState {
	READING_ORIGINAL_FILE = 'READING_ORIGINAL_FILE',
	GENERATING_FILE_DIFFS = 'GENERATING_FILE_DIFFS',
	HIGHLIGHTING_FILE_DIFFS = 'HIGHLIGHTING_FILE_DIFFS',
	UPDATING_MESSAGES = 'UPDATING_MESSAGES',
	IDLE = 'IDLE',
	EDITING_FILE = 'EDITING_FILE',
	EDIT_FILE_SUCCESS_IDLE = 'EDIT_FILE_SUCCESS_IDLE',
	EDIT_FILE_ERROR_IDLE = 'EDIT_FILE_ERROR_IDLE',
}

//  State machine states
export type EditFileMachineState =
	| {
			value: EditFileState.READING_ORIGINAL_FILE;
			context: EditFileMachineContext;
	  }
	| {
			value: EditFileState.GENERATING_FILE_DIFFS;
			context: EditFileMachineContext;
	  }
	| {
			value: EditFileState.HIGHLIGHTING_FILE_DIFFS;
			context: EditFileMachineContext;
	  }
	| {
			value: EditFileState.UPDATING_MESSAGES;
			context: EditFileMachineContext;
	  }
	| {value: EditFileState.IDLE; context: EditFileMachineContext}
	| {value: EditFileState.EDITING_FILE; context: EditFileMachineContext}
	| {
			value: EditFileState.EDIT_FILE_SUCCESS_IDLE;
			context: EditFileMachineContext;
	  }
	| {
			value: EditFileState.EDIT_FILE_ERROR_IDLE;
			context: EditFileMachineContext;
	  };

// Event
export enum EditFileEvent {
	ENTER_KEY_PRESS = 'ENTER_KEY_PRESS',
}

export type EditFileMachineEvent = {type: EditFileEvent.ENTER_KEY_PRESS};

// Guards
const isLastItem = (context: EditFileMachineContext) =>
	(context.diffs?.length ?? 0) - 1 === context.currentDiffHighlightingIndex;

export const editFileMachine = createMachine<
	EditFileMachineContext,
	EditFileMachineEvent,
	EditFileMachineState
>({
	id: 'editFileMachine',
	predictableActionArguments: true,
	initial: EditFileState.READING_ORIGINAL_FILE,
	context: initialEditFileMachineContext,
	states: {
		[EditFileState.READING_ORIGINAL_FILE]: {
			invoke: {
				src: async context => (await fs.readFile(context.filePath)).toString(),
				onDone: {
					target: EditFileState.GENERATING_FILE_DIFFS,
					actions: assign({
						originalFileContent: (_, event: DoneInvokeEvent<string>) =>
							event.data,
					}),
				},
			},
		},
		[EditFileState.GENERATING_FILE_DIFFS]: {
			invoke: {
				src: async context =>
					await getDiffsAsync({
						originalFile: context.originalFileContent ?? '',
						newFile: context.fileContent ?? '',
					}),
				onDone: {
					target: EditFileState.HIGHLIGHTING_FILE_DIFFS,
					actions: [
						(_, event: DoneInvokeEvent<Change[]>) =>
							console.log('Diffs:', event.data),
						assign({
							diffs: (_, event: DoneInvokeEvent<Change[]>) => event.data,
						}),
					],
				},
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log('Error Generating Diffs:', event.data),
				},
			},
		},
		[EditFileState.HIGHLIGHTING_FILE_DIFFS]: {
			invoke: {
				src: async context => {
					const currentDiff =
						context?.diffs?.[context?.currentDiffHighlightingIndex ?? 0];
					// TODO: Add to tool call "file_extension"
					const file_extension = 'ts';
					loadLanguages(file_extension);
					if (currentDiff?.added ?? currentDiff?.removed) {
						return await highlightAsync({
							code: currentDiff?.value ?? '',
							language: file_extension,
							themeOptions: {
								highlightAddition: currentDiff?.added,
								highlightRemoval: currentDiff?.removed,
							},
						});
					} else {
						return await highlightAsync({
							code: currentDiff?.value ?? '',
							language: file_extension,
							themeOptions: {},
						});
						return chalk.hex(Colors.DarkGray)(currentDiff?.value);
					}
				},
				onDone: [
					// Loop until all diffs are highlighted
					{
						cond: context => !isLastItem(context),
						actions: [
							assign({
								highlightedCode: (context, event: DoneInvokeEvent<string>) =>
									(context.highlightedCode += event.data),
							}),
							assign({
								currentDiffHighlightingIndex: context =>
									(context?.currentDiffHighlightingIndex ?? 0) + 1,
							}),
						],
						target: EditFileState.HIGHLIGHTING_FILE_DIFFS,
					},
					{
						cond: context => isLastItem(context),
						actions: assign({
							highlightedCode: (context, event: DoneInvokeEvent<string>) =>
								(context.highlightedCode += event.data),
						}),
						target: EditFileState.UPDATING_MESSAGES,
					},
				],
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log(
							'Error highlighting file diffs',
							JSON.stringify(event.data),
						),
				},
			},
		},

		[EditFileState.UPDATING_MESSAGES]: {
			always: [
				{
					target: EditFileState.IDLE,
					actions: [
						sendParent(context => ({
							type: ChatEvent.ADD_MESSAGE,
							message: {
								id: uuid(),
								text: context.highlightedCode,
								isEditFile: true,
							},
						})),
					],
				},
			],
		},
		[EditFileState.IDLE]: {
			on: {
				[EditFileEvent.ENTER_KEY_PRESS]: {
					target: EditFileState.EDITING_FILE,
				},
			},
		},
		[EditFileState.EDITING_FILE]: {
			entry: [assign({isLoading: true, showSuccessSection: true})],
			invoke: {
				src: async context => {
					await sleep(2000);
					return await writeToFile({
						filePath: context?.filePath ?? '',
						fileContent: context?.formattedCode ?? '',
					});
				},
				onDone: {
					target: EditFileState.EDIT_FILE_SUCCESS_IDLE,
				},
			},
			exit: [assign({isLoading: false})],
		},
		[EditFileState.EDIT_FILE_SUCCESS_IDLE]: {
			entry: [
				assign(context => ({
					enterLabel: 'next step',
					isSuccess: true,
					successMessage: `Successfully created ${context.filePath}`,
				})),
			],
			on: {
				[EditFileEvent.ENTER_KEY_PRESS]: {
					actions: sendParent(context => ({
						type: ChatEvent.SUBMIT_TOOL_OUTPUT,
						toolOutput: {
							tool_call_id: context.toolCallId,
							output: JSON.stringify({response: 'file edited successfully'}),
						},
					})),
				},
			},
		},
	},
});
