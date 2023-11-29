import {chalk, fs, sleep} from 'zx';
import * as prettier from 'prettier';
import {createMachine, assign, type DoneInvokeEvent} from 'xstate';

import {generateFileEdits} from '../utils/api/generateFileEdits.js';
import {type Change} from 'diff';
import {getDiffsAsync} from '../utils/getDiffsAsync.js';
import {highlightAsync} from '../utils/highlightAsync.js';
import loadLanguages from 'prismjs/components/index.js';
import {Colors} from '../utils/Colors.js';
import {writeToFile} from '../utils/writeToFile.js';
import {sendParent} from 'xstate/lib/actions.js';
import {StepsEvent} from '../types/Steps.js';
import {type RunStatusResponse, type Run} from '../types/Run.js';
import {generateFileEditsStatus} from '../utils/api/generateFileEditsStatus.js';
import {fetchFileEdits} from '../utils/api/fetchFileEdits.js';

// Context
export interface ModifyFileMachineContext {
	originalFilePath: string;
	originalFileExtension: string;
	originalFileSummary: string;
	editedFileChangesSummary: string;
	originalFileRawCode: string;
	originalFileFormattedCode: string;
	editedFileRawCode: string;
	editedFileFormattedCode: string;
	editedFileHighlightedCode: string;
	diffs: Change[];
	currentDiffHighlightingIndex: number;
	run?: Run;

	// Component states
	enterLabel?: string;
	loadingMessage: string;
	successMessage: string;
	errorMessage: string;
	isError: boolean;
	isLoading: boolean;
	isFetchEditsSuccess: boolean;
	isApplyEditsSuccess: boolean;
}

export const initialModifyFileMachineContext: ModifyFileMachineContext = {
	originalFilePath: '',
	originalFileExtension: '',
	originalFileSummary: '',
	editedFileChangesSummary: '',
	originalFileRawCode: '',
	originalFileFormattedCode: '',
	editedFileRawCode: '',
	editedFileFormattedCode: '',
	editedFileHighlightedCode: '',
	diffs: [],
	currentDiffHighlightingIndex: 0,

	// Component states
	enterLabel: 'generate changes',
	isLoading: false,
	isError: false,
	isFetchEditsSuccess: false,
	isApplyEditsSuccess: false,
	loadingMessage: '',
	errorMessage: '',
	successMessage: '',
};

// States
export enum ModifyFileState {
	READING_ORIGINAL_FILE = 'READING_ORIGINAL_FILE',
	READING_ORIGINAL_FILE_ERROR_IDLE = 'READING_ORIGINAL_FILE_ERROR_IDLE',
	FORMATTING_ORIGINAL_FILE_RAW_CODE = 'FORMATTING_ORIGINAL_FILE_RAW_CODE',
	IDLE = 'IDLE',
	GENERATE_FILE_EDITS = 'GENERATE_FILE_EDITS',
	POLLING_GENERATE_FILE_EDITS = 'POLLING_GENERATE_FILE_EDITS',
	FETCH_ALL_FILE_EDITS = 'FETCH_ALL_FILE_EDITS',
	FETCHING_EDITED_FILE_ERROR_IDLE = 'FETCHING_EDITED_FILE_ERROR_IDLE',
	FORMATTING_EDITED_FILE_RAW_CODE = 'FORMATTING_EDITED_FILE_RAW_CODE',
	GENERATING_FILE_DIFFS = 'GENERATING_FILE_DIFFS',
	HIGHLIGHTING_FILE_DIFFS = 'HIGHLIGHTING_FILE_DIFFS',
	PREVIEW_DIFFS_IDLE = 'PREVIEW_DIFFS_IDLE',
	APPLYING_CHANGES = 'APPLYING_CHANGES',
	APPLIED_CHANGES_SUCCESS_IDLE = 'APPLIED_CHANGES_SUCCESS_IDLE',
}

export type ModifyFileMachineState =
	| {
			value: ModifyFileState.READING_ORIGINAL_FILE;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.READING_ORIGINAL_FILE_ERROR_IDLE;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.FORMATTING_ORIGINAL_FILE_RAW_CODE;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.IDLE;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.GENERATE_FILE_EDITS;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.POLLING_GENERATE_FILE_EDITS;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.FETCH_ALL_FILE_EDITS;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.FETCHING_EDITED_FILE_ERROR_IDLE;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.FORMATTING_EDITED_FILE_RAW_CODE;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.GENERATING_FILE_DIFFS;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.HIGHLIGHTING_FILE_DIFFS;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.PREVIEW_DIFFS_IDLE;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.APPLYING_CHANGES;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.APPLIED_CHANGES_SUCCESS_IDLE;
			context: ModifyFileMachineContext;
	  };

// Events
export enum ModifyFileEvent {
	ENTER_KEY_PRESSED = 'ENTER_KEY_PRESSED',
}

export type ModifyFileMachineEvent = {type: ModifyFileEvent.ENTER_KEY_PRESSED};

// Guards
const isLastItem = (context: ModifyFileMachineContext) =>
	(context.diffs?.length ?? 0) - 1 === context.currentDiffHighlightingIndex;

export const modifyFileMachine = createMachine<
	ModifyFileMachineContext,
	ModifyFileMachineEvent,
	ModifyFileMachineState
>({
	id: 'modifyFileMachine',
	preserveActionOrder: true,
	predictableActionArguments: true,
	initial: ModifyFileState.READING_ORIGINAL_FILE,
	context: initialModifyFileMachineContext,
	states: {
		[ModifyFileState.READING_ORIGINAL_FILE]: {
			invoke: {
				src: async context =>
					(await fs.readFile(context.originalFilePath)).toString(),
				onDone: {
					target: ModifyFileState.FORMATTING_ORIGINAL_FILE_RAW_CODE,
					actions: assign({
						originalFileRawCode: (_, event: DoneInvokeEvent<string>) =>
							event.data,
					}),
				},
				onError: {
					target: ModifyFileState.READING_ORIGINAL_FILE_ERROR_IDLE,
				},
			},
		},
		[ModifyFileState.READING_ORIGINAL_FILE_ERROR_IDLE]: {
			entry: assign({
				isError: true,
				enterLabel: 'retry',
				errorMessage: context =>
					`Can't read the file at ${chalk
						.hex(Colors.LightRed)
						.bold(
							context.originalFilePath,
						)}. Make sure it can be accessed, then retry.`,
			}),
			exit: assign({
				isError: false,
				enterLabel: initialModifyFileMachineContext.enterLabel,
				errorMessage: initialModifyFileMachineContext.errorMessage,
			}),
			on: {
				[ModifyFileEvent.ENTER_KEY_PRESSED]: {
					target: ModifyFileState.READING_ORIGINAL_FILE,
				},
			},
		},
		[ModifyFileState.FORMATTING_ORIGINAL_FILE_RAW_CODE]: {
			invoke: {
				src: async context =>
					await prettier.format(context.originalFileRawCode, {
						filepath: context.originalFilePath,
					}),
				onDone: {
					target: ModifyFileState.IDLE,
					actions: assign({
						originalFileFormattedCode: (_, event: DoneInvokeEvent<string>) =>
							event.data,
					}),
				},
				onError: {
					target: ModifyFileState.IDLE,
					actions: assign({
						originalFileFormattedCode: context => context.originalFileRawCode,
					}),
				},
			},
		},
		[ModifyFileState.IDLE]: {
			on: {
				[ModifyFileEvent.ENTER_KEY_PRESSED]: {
					target: ModifyFileState.GENERATE_FILE_EDITS,
				},
			},
		},
		[ModifyFileState.GENERATE_FILE_EDITS]: {
			entry: assign({
				isLoading: true,
				loadingMessage: context =>
					`Generating changes for ${chalk.bold(context.originalFilePath)}`,
			}),
			invoke: {
				src: async context =>
					await generateFileEdits({
						filePath: context.originalFilePath,
						fileContent: context.originalFileRawCode,
						fileSummary: context.originalFileSummary,
						fileChangesSummary: context.editedFileChangesSummary,
					}),
				onDone: {
					target: ModifyFileState.POLLING_GENERATE_FILE_EDITS,
					actions: assign({
						run: (_, event: DoneInvokeEvent<Run>) => event.data,
					}),
				},
				onError: {
					target: ModifyFileState.FETCHING_EDITED_FILE_ERROR_IDLE,
				},
			},
		},
		[ModifyFileState.POLLING_GENERATE_FILE_EDITS]: {
			invoke: {
				src: async context => {
					if (context.run) {
						await sleep(1000);
						return await generateFileEditsStatus(context.run);
					} else {
						throw new Error('Run ID not found in context');
					}
				},
				onDone: [
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							event.data.status !== 'completed',
						target: ModifyFileState.POLLING_GENERATE_FILE_EDITS,
					},
					{
						cond: (_, event: DoneInvokeEvent<RunStatusResponse>) =>
							event.data.status === 'completed',
						target: ModifyFileState.FETCH_ALL_FILE_EDITS,
					},
				],
			},
		},
		[ModifyFileState.FETCH_ALL_FILE_EDITS]: {
			invoke: {
				src: async context => {
					if (context.run) {
						return await fetchFileEdits(context.run);
					} else {
						throw new Error('Thread ID not found in context');
					}
				},
				onDone: {
					target: ModifyFileState.FORMATTING_EDITED_FILE_RAW_CODE,
					actions: assign({
						editedFileRawCode: (
							_,
							event: DoneInvokeEvent<{editedFile: string}>,
						) => event.data.editedFile,
					}),
				},
			},
		},
		[ModifyFileState.FETCHING_EDITED_FILE_ERROR_IDLE]: {
			entry: assign({
				isError: true,
				enterLabel: 'retry',
				errorMessage: context =>
					`Couldn't generate changes for ${chalk.bold(
						context.originalFilePath,
					)}. Check your internet connection.`,
			}),
			on: {
				[ModifyFileEvent.ENTER_KEY_PRESSED]: {
					target: ModifyFileState.GENERATE_FILE_EDITS,
				},
			},
			exit: assign({
				isError: false,
				enterLabel: initialModifyFileMachineContext.enterLabel,
				errorMessage: initialModifyFileMachineContext.errorMessage,
			}),
		},
		[ModifyFileState.FORMATTING_EDITED_FILE_RAW_CODE]: {
			invoke: {
				src: async context =>
					await prettier.format(context.editedFileRawCode ?? '', {
						filepath: context.originalFilePath,
					}),
				onDone: {
					target: ModifyFileState.GENERATING_FILE_DIFFS,
					actions: assign({
						editedFileFormattedCode: (_, event: DoneInvokeEvent<string>) =>
							event.data,
					}),
				},
				onError: {
					target: ModifyFileState.GENERATING_FILE_DIFFS,
					actions: assign({
						editedFileFormattedCode: context => context.editedFileRawCode,
					}),
				},
			},
		},
		[ModifyFileState.GENERATING_FILE_DIFFS]: {
			invoke: {
				src: async context =>
					await getDiffsAsync({
						originalFile: context.originalFileFormattedCode ?? '',
						newFile: context.editedFileFormattedCode ?? '',
					}),
				onDone: {
					target: ModifyFileState.HIGHLIGHTING_FILE_DIFFS,
					actions: assign({
						currentDiffHighlightingIndex: 0,
						diffs: (_, event: DoneInvokeEvent<Change[]>) => event.data,
					}),
				},
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log('Error Generating Diffs:', event.data),
				},
			},
		},
		[ModifyFileState.HIGHLIGHTING_FILE_DIFFS]: {
			invoke: {
				src: async context => {
					const currentDiff =
						context?.diffs?.[context?.currentDiffHighlightingIndex ?? 0];
					loadLanguages(context.originalFileExtension);
					if (currentDiff?.added ?? currentDiff?.removed) {
						return await highlightAsync({
							code: currentDiff?.value ?? '',
							language: context.originalFileExtension,
							themeOptions: {
								highlightAddition: currentDiff?.added,
								highlightRemoval: currentDiff?.removed,
							},
						});
					} else {
						return chalk.hex(Colors.DarkGray)(currentDiff?.value);
					}
				},
				onDone: [
					// Loop and highlight all diffs
					{
						cond: context => !isLastItem(context),
						actions: [
							assign({
								editedFileHighlightedCode: (
									context,
									event: DoneInvokeEvent<string>,
								) => (context.editedFileHighlightedCode += event.data),
							}),
							assign({
								currentDiffHighlightingIndex: context =>
									(context?.currentDiffHighlightingIndex ?? 0) + 1,
							}),
						],
						target: ModifyFileState.HIGHLIGHTING_FILE_DIFFS,
					},
					{
						cond: context => isLastItem(context),
						actions: assign({
							editedFileHighlightedCode: (
								context,
								event: DoneInvokeEvent<string>,
							) => (context.editedFileHighlightedCode += event.data),
						}),
						target: ModifyFileState.PREVIEW_DIFFS_IDLE,
					},
				],
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log(
							'ERROR HIGHLIGHTING FILE DIFFS: ',
							JSON.stringify(event.data),
						),
				},
			},
		},
		[ModifyFileState.PREVIEW_DIFFS_IDLE]: {
			entry: assign({
				isLoading: false,
				loadingMessage: initialModifyFileMachineContext.loadingMessage,
				isFetchEditsSuccess: true,
				successMessage: context =>
					`Successfully generated changes for ${chalk.bold(
						context.originalFilePath,
					)}`,
				enterLabel: 'apply changes',
			}),
			on: {
				[ModifyFileEvent.ENTER_KEY_PRESSED]: {
					target: ModifyFileState.APPLYING_CHANGES,
				},
			},
		},
		[ModifyFileState.APPLYING_CHANGES]: {
			invoke: {
				src: async context =>
					await writeToFile({
						filePath: context.originalFilePath ?? '',
						fileContent: context.editedFileFormattedCode ?? '',
					}),
				onDone: {
					target: ModifyFileState.APPLIED_CHANGES_SUCCESS_IDLE,
				},
			},
		},
		[ModifyFileState.APPLIED_CHANGES_SUCCESS_IDLE]: {
			entry: assign({
				isApplyEditsSuccess: true,
				successMessage: context =>
					`Successfully applied changes to ${chalk.bold(
						context.originalFilePath,
					)}`,
				enterLabel: 'next step',
			}),
			on: {
				[ModifyFileEvent.ENTER_KEY_PRESSED]: {
					actions: sendParent({type: StepsEvent.NAVIGATE_NEXT_STEP}),
				},
			},
		},
	},
});
