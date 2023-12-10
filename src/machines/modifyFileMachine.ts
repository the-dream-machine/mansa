import {chalk, fs, sleep} from 'zx';
import * as prettier from 'prettier';
import {createMachine, assign, type DoneInvokeEvent} from 'xstate';

import {type Change} from 'diff';
import {getDiffsAsync} from '../utils/getDiffsAsync.js';
import {highlightAsync} from '../utils/highlightAsync.js';
import loadLanguages from 'prismjs/components/index.js';
import {Colors} from '../styles/Colors.js';
import {writeToFile} from '../utils/writeToFile.js';
import {sendParent} from 'xstate/lib/actions.js';
import {StepsEvent} from '../types/StepsMachine.js';
import {type Run} from '../types/Run.js';
import {sendQueryMachine} from './sendQueryMachine.js';
import {initialSendQueryMachineContext} from '../utils/initialSendQueryMachineContext.js';
import {type SendQueryMachineResult} from '../types/SendQuery.js';
import {sanitizeLanguage} from '../utils/sanitizeLanguage.js';

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
	showFetchEditsSection: boolean;
	isFetchEditsLoading: boolean;
	isFetchEditsSuccess: boolean;
	isFetchEditsError: boolean;
	showApplyEditsSection: boolean;
	isApplyEditsLoading: boolean;
	isApplyEditsSuccess: boolean;
	isApplyEditsError: boolean;

	errorMessage: string;
}

export const initialModifyFileMachineContext: ModifyFileMachineContext = {
	run: undefined,
	originalFilePath: '',
	originalFileExtension: '',
	originalFileSummary: '',
	editedFileChangesSummary: '',
	originalFileRawCode: '',
	originalFileFormattedCode: '',
	editedFileRawCode:
		'```json\n{\n  "name": "ragdoll",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "build": "next build",\n    "db:push": "prisma db push",\n    "db:studio": "prisma studio",\n    "dev": "next dev",\n    "postinstall": "prisma generate",\n    "lint": "next lint",\n    "start": "next start",\n    "trigger": "trigger.dev --endpoint=<UNIQUE_ENDPOINT_IDENTIFIER>"\n  },\n  "dependencies": {\n    "@prisma/client": "^5.1.1",\n    "@t3-oss/env-nextjs": "^0.7.0",\n    "@tanstack/react-query": "^4.32.6",\n    "@trpc/client": "^10.37.1",\n    "@trpc/next": "^10.37.1",\n    "@trpc/react-query": "^10.37.1",\n    "@trpc/server": "^10.37.1",\n    "next": "^13.5.4",\n    "react": "18.2.0",\n    "react-dom": "18.2.0",\n    "superjson": "^1.13.1",\n    "zod": "^3.22.4",\n    "trigger.dev": "latest"\n  },\n  "devDependencies": {\n    "@types/eslint": "^8.44.2",\n    "@types/node": "^18.16.0",\n    "@types/react": "^18.2.20",\n    "@types/react-dom": "^18.2.7",\n    "@typescript-eslint/eslint-plugin": "^6.3.0",\n    "@typescript-eslint/parser": "^6.3.0",\n    "eslint": "^8.47.0",\n    "eslint-config-next": "^13.5.4",\n    "prisma": "^5.1.1",\n    "typescript": "^5.1.6"\n  },\n  "ct3aMetadata": {\n    "initVersion": "7.22.0"\n  }\n}\n```',
	editedFileFormattedCode: '',
	editedFileHighlightedCode: '',
	diffs: [],
	currentDiffHighlightingIndex: 0,

	// Component states
	enterLabel: 'preview changes',
	showFetchEditsSection: false,
	isFetchEditsLoading: false,
	isFetchEditsSuccess: false,
	isFetchEditsError: false,
	showApplyEditsSection: false,
	isApplyEditsLoading: false,
	isApplyEditsSuccess: false,
	isApplyEditsError: false,
	errorMessage: '',
};

// States
export enum ModifyFileState {
	READING_ORIGINAL_FILE = 'READING_ORIGINAL_FILE',
	READING_ORIGINAL_FILE_ERROR_IDLE = 'READING_ORIGINAL_FILE_ERROR_IDLE',
	FORMATTING_ORIGINAL_FILE_RAW_CODE = 'FORMATTING_ORIGINAL_FILE_RAW_CODE',
	IDLE = 'IDLE',
	GENERATING_FILE_EDITS = 'GENERATING_FILE_EDITS',
	GENERATING_FILE_EDITS_ERROR_IDLE = 'GENERATING_FILE_EDITS_ERROR_IDLE',
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
			value: ModifyFileState.GENERATING_FILE_EDITS;
			context: ModifyFileMachineContext;
	  }
	| {
			value: ModifyFileState.GENERATING_FILE_EDITS_ERROR_IDLE;
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
				enterLabel: 'retry',
				errorMessage: context =>
					`Can't read the file at ${chalk
						.hex(Colors.LightRed)
						.bold(
							context.originalFilePath,
						)}. Make sure it can be accessed, then retry.`,
			}),
			exit: assign({
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
					target: ModifyFileState.GENERATING_FILE_EDITS,
				},
			},
		},
		[ModifyFileState.GENERATING_FILE_EDITS]: {
			entry: assign({isFetchEditsLoading: true, showFetchEditsSection: true}),
			invoke: {
				src: context =>
					sendQueryMachine.withContext({
						...initialSendQueryMachineContext,
						query: `Here is a summary of the file ${context.originalFilePath}: ${context.originalFileSummary}
Here is the file content:
\`\`\`${context.originalFileExtension}
${context.originalFileRawCode}
\`\`\`
Make the following changes to the file:${context.editedFileChangesSummary}
No preamble. Only respond with the updated file. Do not truncate anything.`,
					}),
				onDone: {
					target: ModifyFileState.FORMATTING_EDITED_FILE_RAW_CODE,
					actions: assign(
						(_, event: DoneInvokeEvent<SendQueryMachineResult<string>>) => ({
							editedFileRawCode: event.data.result
								.replace(/^```[\s\S]*?\n/, '') // Remove backticks
								.replace(/```$/, ''),
							run: event.data.run,
						}),
					),
				},
				onError: {
					target: ModifyFileState.GENERATING_FILE_EDITS_ERROR_IDLE,
				},
			},
			exit: assign({isFetchEditsLoading: false}),
		},
		[ModifyFileState.GENERATING_FILE_EDITS_ERROR_IDLE]: {
			entry: assign({
				isFetchEditsError: true,
				enterLabel: 'retry',
				errorMessage: context =>
					`Couldn't generate changes for ${chalk.bold(
						context.originalFilePath,
					)}. Check your internet connection.`,
			}),
			on: {
				[ModifyFileEvent.ENTER_KEY_PRESSED]: {
					target: ModifyFileState.GENERATING_FILE_EDITS,
				},
			},
			exit: assign({
				isFetchEditsError: false,
				enterLabel: initialModifyFileMachineContext.enterLabel,
				errorMessage: initialModifyFileMachineContext.errorMessage,
			}),
		},
		[ModifyFileState.FORMATTING_EDITED_FILE_RAW_CODE]: {
			invoke: {
				src: async context => {
					const language = sanitizeLanguage(context.originalFileExtension);
					await prettier.format(context.editedFileRawCode ?? '', {
						filepath: language,
					});
				},
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
			entry: assign({isFetchEditsSuccess: true, enterLabel: 'apply changes'}),
			on: {
				[ModifyFileEvent.ENTER_KEY_PRESSED]: {
					target: ModifyFileState.APPLYING_CHANGES,
				},
			},
		},
		[ModifyFileState.APPLYING_CHANGES]: {
			entry: assign({isApplyEditsLoading: true, showApplyEditsSection: true}),
			invoke: {
				src: async context => {
					await sleep(2000);
					await writeToFile({
						filePath: context.originalFilePath ?? '',
						fileContent: context.editedFileFormattedCode ?? '',
					});
				},
				onDone: {
					target: ModifyFileState.APPLIED_CHANGES_SUCCESS_IDLE,
				},
			},
			exit: assign({isApplyEditsLoading: false}),
		},
		[ModifyFileState.APPLIED_CHANGES_SUCCESS_IDLE]: {
			entry: assign({isApplyEditsSuccess: true, enterLabel: 'next step'}),
			on: {
				[ModifyFileEvent.ENTER_KEY_PRESSED]: {
					actions: sendParent({type: StepsEvent.NAVIGATE_NEXT_STEP}),
				},
			},
		},
	},
});
