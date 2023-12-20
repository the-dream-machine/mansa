import {createMachine, assign, type DoneInvokeEvent} from 'xstate';

import {highlightAsync} from '../../utils/highlightAsync.js';
import loadLanguages from 'prismjs/components/index.js';
import {writeToFile} from '../../utils/writeToFile.js';
import {sendParent} from 'xstate/lib/actions.js';
import {fs, sleep} from 'zx';

import {getDiffsAsync} from '../../utils/getDiffsAsync.js';
import {type Change} from 'diff';
import {ToolEvent} from '../../types/ToolMachine.js';

// Context
export interface EditFileToolMachineContext {
	originalFileContent: string;
	filePath: string;
	fileExtension: string;
	fileContent?: string;
	diffs: Change[];
	currentDiffHighlightingIndex: number;
	highlightedDiffFile?: string;
	enterLabel: string;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	errorMessage: string;
	showSuccessSection: boolean;
}

export const initialEditFileToolMachineContext: EditFileToolMachineContext = {
	originalFileContent: '',
	filePath: '',
	fileExtension: '',
	fileContent: '',
	highlightedDiffFile: '',
	diffs: [],
	currentDiffHighlightingIndex: 0,
	enterLabel: 'edit file',
	isLoading: false,
	isSuccess: false,
	isError: false,
	errorMessage: '',
	showSuccessSection: false,
};

// States
export enum EditFileToolState {
	READING_ORIGINAL_FILE = 'READING_ORIGINAL_FILE',
	GENERATING_FILE_DIFFS = 'GENERATING_FILE_DIFFS',
	HIGHLIGHTING_FILE_DIFFS = 'HIGHLIGHTING_FILE_DIFFS',

	IDLE = 'IDLE',
	EDITING_FILE = 'EDITING_FILE',
	SUCCESS_IDLE = 'SUCCESS_IDLE',
	ERROR_IDLE = 'ERROR_IDLE',
	FINAL = 'FINAL',
}

//  State machine states
export type EditFileToolMachineState =
	| {
			value: EditFileToolState.READING_ORIGINAL_FILE;
			context: EditFileToolMachineContext;
	  }
	| {
			value: EditFileToolState.GENERATING_FILE_DIFFS;
			context: EditFileToolMachineContext;
	  }
	| {
			value: EditFileToolState.HIGHLIGHTING_FILE_DIFFS;
			context: EditFileToolMachineContext;
	  }
	| {value: EditFileToolState.IDLE; context: EditFileToolMachineContext}
	| {value: EditFileToolState.EDITING_FILE; context: EditFileToolMachineContext}
	| {
			value: EditFileToolState.SUCCESS_IDLE;
			context: EditFileToolMachineContext;
	  }
	| {
			value: EditFileToolState.ERROR_IDLE;
			context: EditFileToolMachineContext;
	  }
	| {
			value: EditFileToolState.FINAL;
			context: EditFileToolMachineContext;
	  };

// Event
export enum EditFileToolEvent {
	ENTER_KEY_PRESS = 'ENTER_KEY_PRESS',
}

export type EditFileToolMachineEvent = {
	type: EditFileToolEvent.ENTER_KEY_PRESS;
};

// Guards
const isLastItem = (context: EditFileToolMachineContext) =>
	(context.diffs?.length ?? 0) - 1 === context.currentDiffHighlightingIndex;

export const editFileToolMachine = createMachine<
	EditFileToolMachineContext,
	EditFileToolMachineEvent,
	EditFileToolMachineState
>({
	id: 'editFileToolMachine',
	predictableActionArguments: true,
	initial: EditFileToolState.READING_ORIGINAL_FILE,
	context: initialEditFileToolMachineContext,
	states: {
		[EditFileToolState.READING_ORIGINAL_FILE]: {
			invoke: {
				src: async context => (await fs.readFile(context.filePath)).toString(),
				onDone: {
					target: EditFileToolState.GENERATING_FILE_DIFFS,
					actions: assign({
						originalFileContent: (_, event: DoneInvokeEvent<string>) =>
							event.data,
					}),
				},
			},
		},
		[EditFileToolState.GENERATING_FILE_DIFFS]: {
			invoke: {
				src: async context =>
					await getDiffsAsync({
						originalFile: context.originalFileContent ?? '',
						newFile: context.fileContent ?? '',
					}),
				onDone: {
					target: EditFileToolState.HIGHLIGHTING_FILE_DIFFS,
					actions: [
						assign({
							diffs: (_, event: DoneInvokeEvent<Change[]>) => event.data,
						}),
					],
				},
				onError: {
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
		},
		[EditFileToolState.HIGHLIGHTING_FILE_DIFFS]: {
			invoke: {
				src: async context => {
					const currentDiff =
						context?.diffs?.[context?.currentDiffHighlightingIndex ?? 0];

					loadLanguages(context.fileExtension);
					if (currentDiff?.added ?? currentDiff?.removed) {
						return await highlightAsync({
							code: currentDiff?.value ?? '',
							language: context.fileExtension,
							themeOptions: {
								highlightAddition: currentDiff?.added,
								highlightRemoval: currentDiff?.removed,
							},
						});
					} else {
						return await highlightAsync({
							code: currentDiff?.value ?? '',
							language: context.fileExtension,
						});
					}
				},
				onDone: [
					{
						cond: context => !isLastItem(context),
						actions: [
							assign({
								highlightedDiffFile: (
									context,
									event: DoneInvokeEvent<string>,
								) => (context.highlightedDiffFile += event.data),
							}),
							assign({
								currentDiffHighlightingIndex: context =>
									(context?.currentDiffHighlightingIndex ?? 0) + 1,
							}),
						],
						target: EditFileToolState.HIGHLIGHTING_FILE_DIFFS,
					},
					{
						cond: context => isLastItem(context),
						actions: assign({
							highlightedDiffFile: (context, event: DoneInvokeEvent<string>) =>
								(context.highlightedDiffFile += event.data),
						}),
						target: EditFileToolState.IDLE,
					},
				],
				onError: {
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
		},
		[EditFileToolState.IDLE]: {
			on: {
				[EditFileToolEvent.ENTER_KEY_PRESS]: {
					target: EditFileToolState.EDITING_FILE,
				},
			},
		},
		[EditFileToolState.EDITING_FILE]: {
			entry: [assign({isLoading: true, showSuccessSection: true})],
			invoke: {
				src: async context => {
					await sleep(2000);
					return await writeToFile({
						filePath: context?.filePath ?? '',
						fileContent: context?.fileContent ?? '',
					});
				},
				onDone: {
					target: EditFileToolState.SUCCESS_IDLE,
				},
			},
			exit: [assign({isLoading: false})],
		},
		[EditFileToolState.SUCCESS_IDLE]: {
			entry: [
				assign(context => ({
					enterLabel: 'next step',
					isSuccess: true,
					successMessage: `Successfully created ${context.filePath}`,
				})),
			],
			on: {
				[EditFileToolEvent.ENTER_KEY_PRESS]: {
					target: EditFileToolState.FINAL,
					actions: [
						sendParent({
							type: ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT,
							output: JSON.stringify({response: 'success'}),
						}),
					],
				},
			},
		},
		[EditFileToolState.ERROR_IDLE]: {
			entry: [assign({isError: true})],
			on: {
				[EditFileToolEvent.ENTER_KEY_PRESS]: {
					target: EditFileToolState.READING_ORIGINAL_FILE,
				},
			},
			exit: [assign({isError: false})],
		},
		[EditFileToolState.FINAL]: {
			type: 'final',
		},
	},
});
