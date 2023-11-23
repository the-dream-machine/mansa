/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {chalk, fs} from 'zx';
import * as prettier from 'prettier';
import {createMachine, assign, type DoneInvokeEvent} from 'xstate';

import {generateFileEdits} from '../utils/api/generateFileEdits.js';
import {type Change} from 'diff';
import {getDiffsAsync} from '../utils/getDiffsAsync.js';
import {highlightAsync} from '../utils/highlightAsync.js';
import loadLanguages from 'prismjs/components/index.js';
import {Colors} from '../components/Colors.js';
import {writeToFile} from '../utils/writeToFile.js';
import {sendParent} from 'xstate/lib/actions.js';
import {StepsEvent} from '../types/Steps.js';

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

	FETCHING_EDITED_FILE = 'FETCHING_EDITED_FILE',
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
			value: ModifyFileState.FETCHING_EDITED_FILE;
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

// Services
enum ModifyFileService {
	READ_ORIGINAL_FILE = 'READ_ORIGINAL_FILE',
	FORMAT_ORIGINAL_FILE_RAW_CODE = 'FORMAT_ORIGINAL_FILE_RAW_CODE',
	FETCH_EDITED_FILE = 'FETCH_EDITED_FILE',
	FORMAT_EDITED_FILE_RAW_CODE = 'FORMAT_EDITED_FILE_RAW_CODE',
	GENERATE_FILE_DIFFS = 'GENERATE_FILE_DIFFS',
	HIGHLIGHT_DIFFS = 'HIGHLIGHT_DIFFS',
	APPLY_CHANGES = 'APPLY_CHANGES',
}

// Actions
enum ModifyFileAction {
	UPDATE_ORIGINAL_FILE_RAW_CODE = 'UPDATE_ORIGINAL_FILE_RAW_CODE',
	ENTER_READING_ORIGINAL_FILE_ERROR_IDLE = 'ENTER_READING_ORIGINAL_FILE_ERROR_IDLE',
	EXIT_READING_ORIGINAL_FILE_ERROR_IDLE = 'EXIT_READING_ORIGINAL_FILE_ERROR_IDLE',
	UPDATE_ORIGINAL_FILE_FORMATTED_CODE = 'UPDATE_ORIGINAL_FILE_FORMATTED_CODE',
	UPDATE_ORIGINAL_FILE_FORMATTED_CODE_WITH_RAW_CODE = 'UPDATE_ORIGINAL_FILE_FORMATTED_CODE_WITH_RAW_CODE',
	UPDATE_EDITED_FILE_RAW_CODE = 'UPDATE_EDITED_FILE_RAW_CODE',
	ENTER_FETCHING_EDITED_FILE = 'ENTER_FETCHING_EDITED_FILE',
	ENTER_FETCHING_EDITED_FILE_ERROR_IDLE = 'ENTER_FETCHING_EDITED_FILE_ERROR_IDLE',
	EXIT_FETCHING_EDITED_FILE_ERROR_IDLE = 'EXIT_FETCHING_EDITED_FILE_ERROR_IDLE',
	UPDATE_EDITED_FILE_FORMATTED_CODE = 'UPDATE_EDITED_FILE_FORMATTED_CODE',
	UPDATE_EDITED_FILE_FORMATTED_CODE_WITH_RAW_CODE = 'UPDATE_EDITED_FILE_FORMATTED_CODE_WITH_RAW_CODE',
	UPDATE_DIFFS = 'UPDATE_DIFFS',
	UPDATE_EDITED_FILE_HIGHLIGHTED_CODE = 'UPDATE_EDITED_FILE_HIGHLIGHTED_CODE',
	INCREMENT_CURRENT_DIFF_HIGHLIGHTING_INDEX = 'INCREMENT_CURRENT_DIFF_HIGHLIGHTING_INDEX',
	ENTER_PREVIEW_DIFFS_IDLE = 'ENTER_PREVIEW_DIFFS_IDLE',
	ENTER_APPLIED_CHANGES_SUCCESS_IDLE = 'ENTER_APPLIED_CHANGES_SUCCESS_IDLE',
}

// Guards
const isLastItem = (context: ModifyFileMachineContext) =>
	(context.diffs?.length ?? 0) - 1 === context.currentDiffHighlightingIndex;

export const modifyFileMachine = createMachine<
	ModifyFileMachineContext,
	ModifyFileMachineEvent,
	ModifyFileMachineState
>(
	{
		id: 'modifyFileMachine',
		preserveActionOrder: true,
		predictableActionArguments: true,
		initial: ModifyFileState.READING_ORIGINAL_FILE,
		context: initialModifyFileMachineContext,
		states: {
			[ModifyFileState.READING_ORIGINAL_FILE]: {
				invoke: {
					src: ModifyFileService.READ_ORIGINAL_FILE,
					onDone: {
						target: ModifyFileState.FORMATTING_ORIGINAL_FILE_RAW_CODE,
						actions: [ModifyFileAction.UPDATE_ORIGINAL_FILE_RAW_CODE],
					},
					onError: {
						target: ModifyFileState.READING_ORIGINAL_FILE_ERROR_IDLE,
					},
				},
			},
			[ModifyFileState.READING_ORIGINAL_FILE_ERROR_IDLE]: {
				entry: [ModifyFileAction.ENTER_READING_ORIGINAL_FILE_ERROR_IDLE],
				exit: [ModifyFileAction.EXIT_READING_ORIGINAL_FILE_ERROR_IDLE],
				on: {
					[ModifyFileEvent.ENTER_KEY_PRESSED]: {
						target: ModifyFileState.READING_ORIGINAL_FILE,
					},
				},
			},
			[ModifyFileState.FORMATTING_ORIGINAL_FILE_RAW_CODE]: {
				invoke: {
					src: ModifyFileService.FORMAT_ORIGINAL_FILE_RAW_CODE,
					onDone: {
						target: ModifyFileState.IDLE,
						actions: [ModifyFileAction.UPDATE_ORIGINAL_FILE_FORMATTED_CODE],
					},
					onError: {
						target: ModifyFileState.IDLE,
						actions: [
							ModifyFileAction.UPDATE_ORIGINAL_FILE_FORMATTED_CODE_WITH_RAW_CODE,
						],
					},
				},
			},
			[ModifyFileState.IDLE]: {
				on: {
					[ModifyFileEvent.ENTER_KEY_PRESSED]: {
						target: ModifyFileState.FETCHING_EDITED_FILE,
					},
				},
			},
			[ModifyFileState.FETCHING_EDITED_FILE]: {
				entry: [ModifyFileAction.ENTER_FETCHING_EDITED_FILE],
				invoke: {
					src: ModifyFileService.FETCH_EDITED_FILE,
					onDone: {
						target: ModifyFileState.FORMATTING_EDITED_FILE_RAW_CODE,
						actions: [ModifyFileAction.UPDATE_EDITED_FILE_RAW_CODE],
					},
					onError: {
						target: ModifyFileState.FETCHING_EDITED_FILE_ERROR_IDLE,
					},
				},
			},
			[ModifyFileState.FETCHING_EDITED_FILE_ERROR_IDLE]: {
				entry: [ModifyFileAction.ENTER_FETCHING_EDITED_FILE_ERROR_IDLE],
				on: {
					[ModifyFileEvent.ENTER_KEY_PRESSED]: {
						target: ModifyFileState.FETCHING_EDITED_FILE,
					},
				},
				exit: [ModifyFileAction.EXIT_FETCHING_EDITED_FILE_ERROR_IDLE],
			},
			[ModifyFileState.FORMATTING_EDITED_FILE_RAW_CODE]: {
				invoke: {
					src: ModifyFileService.FORMAT_EDITED_FILE_RAW_CODE,
					onDone: {
						target: ModifyFileState.GENERATING_FILE_DIFFS,
						actions: [ModifyFileAction.UPDATE_EDITED_FILE_FORMATTED_CODE],
					},
					onError: {
						target: ModifyFileState.GENERATING_FILE_DIFFS,
						actions: [
							ModifyFileAction.UPDATE_EDITED_FILE_FORMATTED_CODE_WITH_RAW_CODE,
						],
					},
				},
			},
			[ModifyFileState.GENERATING_FILE_DIFFS]: {
				invoke: {
					src: ModifyFileService.GENERATE_FILE_DIFFS,
					onDone: {
						target: ModifyFileState.HIGHLIGHTING_FILE_DIFFS,
						actions: [ModifyFileAction.UPDATE_DIFFS],
					},
					onError: {
						actions: (_, event: DoneInvokeEvent<Error>) =>
							console.log('Error Generating Diffs:', event.data),
					},
				},
			},
			[ModifyFileState.HIGHLIGHTING_FILE_DIFFS]: {
				invoke: {
					src: ModifyFileService.HIGHLIGHT_DIFFS,
					onDone: [
						// Loop and highlight all diffs
						{
							cond: context => !isLastItem(context),
							actions: [
								ModifyFileAction.UPDATE_EDITED_FILE_HIGHLIGHTED_CODE,
								ModifyFileAction.INCREMENT_CURRENT_DIFF_HIGHLIGHTING_INDEX,
							],
							target: ModifyFileState.HIGHLIGHTING_FILE_DIFFS,
						},
						{
							cond: context => isLastItem(context),
							actions: [ModifyFileAction.UPDATE_EDITED_FILE_HIGHLIGHTED_CODE],
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
				entry: [ModifyFileAction.ENTER_PREVIEW_DIFFS_IDLE],
				on: {
					[ModifyFileEvent.ENTER_KEY_PRESSED]: {
						target: ModifyFileState.APPLYING_CHANGES,
					},
				},
			},
			[ModifyFileState.APPLYING_CHANGES]: {
				invoke: {
					src: ModifyFileService.APPLY_CHANGES,
					onDone: {
						target: ModifyFileState.APPLIED_CHANGES_SUCCESS_IDLE,
					},
				},
			},
			[ModifyFileState.APPLIED_CHANGES_SUCCESS_IDLE]: {
				entry: [ModifyFileAction.ENTER_APPLIED_CHANGES_SUCCESS_IDLE],
				on: {
					[ModifyFileEvent.ENTER_KEY_PRESSED]: {
						actions: sendParent({type: StepsEvent.NAVIGATE_NEXT_STEP}),
					},
				},
			},
		},
	},
	{
		services: {
			[ModifyFileService.READ_ORIGINAL_FILE]: async context =>
				(await fs.readFile(context.originalFilePath)).toString(),
			[ModifyFileService.FORMAT_ORIGINAL_FILE_RAW_CODE]: async context =>
				await prettier.format(context.originalFileRawCode, {
					filepath: context.originalFilePath,
				}),
			[ModifyFileService.FETCH_EDITED_FILE]: async context =>
				await generateFileEdits({
					filePath: context.originalFilePath,
					fileContent: context.originalFileRawCode,
					fileSummary: context.originalFileSummary,
					fileChangesSummary: context.editedFileChangesSummary,
				}),
			[ModifyFileService.FORMAT_EDITED_FILE_RAW_CODE]: async context =>
				await prettier.format(context.editedFileRawCode ?? '', {
					filepath: context.originalFilePath,
				}),
			[ModifyFileService.GENERATE_FILE_DIFFS]: async context =>
				await getDiffsAsync({
					originalFile: context.originalFileFormattedCode ?? '',
					newFile: context.editedFileFormattedCode ?? '',
				}),
			[ModifyFileService.HIGHLIGHT_DIFFS]: async context => {
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
			[ModifyFileService.APPLY_CHANGES]: async context =>
				await writeToFile({
					filePath: context.originalFilePath ?? '',
					fileContent: context.editedFileFormattedCode ?? '',
				}),
		},
		actions: {
			// @ts-ignore
			[ModifyFileAction.UPDATE_ORIGINAL_FILE_RAW_CODE]: assign({
				originalFileRawCode: (_, event: DoneInvokeEvent<string>) => event.data,
			}),
			[ModifyFileAction.ENTER_READING_ORIGINAL_FILE_ERROR_IDLE]: context =>
				assign({
					isError: true,
					errorMessage: `Can't read the file at ${chalk
						.hex(Colors.LightRed)
						.bold(
							context.originalFilePath,
						)}. Make sure it can be accessed, then retry.`,
					enterLabel: 'retry',
				}),
			[ModifyFileAction.EXIT_READING_ORIGINAL_FILE_ERROR_IDLE]: assign({
				isError: false,
				errorMessage: initialModifyFileMachineContext.errorMessage,
				enterLabel: initialModifyFileMachineContext.enterLabel,
			}),
			// @ts-ignore
			[ModifyFileAction.UPDATE_ORIGINAL_FILE_FORMATTED_CODE]: assign({
				originalFileFormattedCode: (_, event: DoneInvokeEvent<string>) =>
					event.data,
			}),
			[ModifyFileAction.UPDATE_ORIGINAL_FILE_FORMATTED_CODE_WITH_RAW_CODE]:
				assign({
					originalFileFormattedCode: context => context.originalFileRawCode,
				}),
			// @ts-ignore
			[ModifyFileAction.UPDATE_EDITED_FILE_RAW_CODE]: assign({
				editedFileRawCode: (_, event: DoneInvokeEvent<{editedFile: string}>) =>
					event.data.editedFile,
			}),
			[ModifyFileAction.ENTER_FETCHING_EDITED_FILE]: assign({
				isLoading: true,
				loadingMessage: context =>
					`Generating changes for ${chalk.bold(context.originalFilePath)}`,
			}),

			[ModifyFileAction.ENTER_FETCHING_EDITED_FILE_ERROR_IDLE]: assign({
				isError: true,
				enterLabel: 'retry',
				errorMessage: context =>
					`Couldn't generate changes for ${chalk.bold(
						context.originalFilePath,
					)}. Check your internet connection.`,
			}),
			[ModifyFileAction.EXIT_FETCHING_EDITED_FILE_ERROR_IDLE]: assign({
				isError: false,
				enterLabel: initialModifyFileMachineContext.enterLabel,
				errorMessage: initialModifyFileMachineContext.errorMessage,
			}),
			// @ts-ignore
			[ModifyFileAction.UPDATE_EDITED_FILE_FORMATTED_CODE]: assign({
				editedFileFormattedCode: (_, event: DoneInvokeEvent<string>) =>
					event.data,
			}),
			[ModifyFileAction.UPDATE_EDITED_FILE_FORMATTED_CODE_WITH_RAW_CODE]:
				assign({
					editedFileFormattedCode: context => context.editedFileRawCode,
				}),
			// @ts-ignore
			[ModifyFileAction.UPDATE_DIFFS]: assign({
				currentDiffHighlightingIndex: 0,
				diffs: (_, event: DoneInvokeEvent<Change[]>) => event.data,
			}),
			// @ts-ignore
			[ModifyFileAction.UPDATE_EDITED_FILE_HIGHLIGHTED_CODE]: assign({
				editedFileHighlightedCode: (context, event: DoneInvokeEvent<string>) =>
					(context.editedFileHighlightedCode += event.data),
			}),
			// @ts-ignore
			[ModifyFileAction.INCREMENT_CURRENT_DIFF_HIGHLIGHTING_INDEX]: assign({
				currentDiffHighlightingIndex: context =>
					(context?.currentDiffHighlightingIndex ?? 0) + 1,
			}),
			[ModifyFileAction.ENTER_PREVIEW_DIFFS_IDLE]: assign({
				isLoading: false,
				loadingMessage: initialModifyFileMachineContext.loadingMessage,
				isFetchEditsSuccess: true,
				successMessage: context =>
					`Successfully generated changes for ${chalk.bold(
						context.originalFilePath,
					)}`,
				enterLabel: 'apply changes',
			}),
			[ModifyFileAction.ENTER_APPLIED_CHANGES_SUCCESS_IDLE]: assign({
				isApplyEditsSuccess: true,
				successMessage: context =>
					`Successfully applied changes to ${chalk.bold(
						context.originalFilePath,
					)}`,
				enterLabel: 'next step',
			}),
		},
	},
);
