import {type DoneInvokeEvent, assign, createMachine, type Sender} from 'xstate';

import {updateRepositoryChecksums} from '../utils/repository/updateRepositoryChecksums.js';
import {updateRepositoryMap} from '../utils/repository/updateRepositoryMap.js';
import {AppState, type NavigationMachineEvent} from './navigationMachine.js';
import {compareAllChecksums} from '../utils/compareAllChecksums.js';

interface IndexNewFilesMachineContext {
	filePaths: string[];
	currentFileIndexing: number;
	enterLabel: 'start indexing' | 'continue' | 'retry';
	repositoryName: string;
	errorMessage: string;
	navigate?: Sender<NavigationMachineEvent>;

	showProgressBar: boolean;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
}

const initialIndexRepositoryMachineContext: IndexNewFilesMachineContext = {
	filePaths: [],
	currentFileIndexing: 0,
	enterLabel: 'start indexing',
	repositoryName: '',
	errorMessage: '',

	showProgressBar: false,
	isLoading: false,
	isSuccess: false,
	isError: false,
};

export enum IndexNewFilesState {
	COMPARING_CHECKSUMS = 'COMPARING_CHECKSUMS',
	IDLE = 'IDLE',
	INDEXING_NEW_FILES = 'INDEXING_NEW_FILES',
	INDEXING_SUCCESS_IDLE = 'INDEXING_SUCCESS_IDLE',
	INDEXING_ERROR_IDLE = 'INDEXING_ERROR_IDLE',
}
type IndexNewFilesMachineState =
	| {
			value: IndexNewFilesState.COMPARING_CHECKSUMS;
			context: IndexNewFilesMachineContext;
	  }
	| {
			value: IndexNewFilesState.IDLE;
			context: IndexNewFilesMachineContext;
	  }
	| {
			value: IndexNewFilesState.INDEXING_NEW_FILES;
			context: IndexNewFilesMachineContext;
	  }
	| {
			value: IndexNewFilesState.INDEXING_SUCCESS_IDLE;
			context: IndexNewFilesMachineContext;
	  }
	| {
			value: IndexNewFilesState.INDEXING_ERROR_IDLE;
			context: IndexNewFilesMachineContext;
	  };

export enum IndexNewFilesEvent {
	ENTER_KEY_PRESSED = 'ENTER_KEY_PRESSED ',
}
type IndexNewFilesMachineEvent = {type: IndexNewFilesEvent.ENTER_KEY_PRESSED};

// Guards
const isLastFilePath = (context: IndexNewFilesMachineContext) =>
	context.filePaths.length - 1 === context.currentFileIndexing;

export const indexNewFilesMachine = createMachine<
	IndexNewFilesMachineContext,
	IndexNewFilesMachineEvent,
	IndexNewFilesMachineState
>({
	id: 'indexNewFilesMachine',
	predictableActionArguments: true,
	preserveActionOrder: true,
	initial: IndexNewFilesState.COMPARING_CHECKSUMS,
	context: initialIndexRepositoryMachineContext,
	states: {
		[IndexNewFilesState.COMPARING_CHECKSUMS]: {
			invoke: {
				src: async () => await compareAllChecksums(),
				onDone: {
					target: IndexNewFilesState.IDLE,
					actions: assign({
						filePaths: (_, event: DoneInvokeEvent<string[]>) => event.data,
					}),
				},
				onError: {
					target: IndexNewFilesState.INDEXING_ERROR_IDLE,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
		},
		[IndexNewFilesState.IDLE]: {
			on: {
				[IndexNewFilesEvent.ENTER_KEY_PRESSED]: {
					target: IndexNewFilesState.INDEXING_NEW_FILES,
				},
			},
		},
		[IndexNewFilesState.INDEXING_NEW_FILES]: {
			entry: [assign({isLoading: true, showProgressBar: true})],
			invoke: {
				src: async context => {
					const filePath = context.filePaths[context.currentFileIndexing] ?? '';
					await updateRepositoryMap({filePath});
					await updateRepositoryChecksums({filePath});
				},
				onDone: [
					{
						// Loop until all files are indexed
						target: IndexNewFilesState.INDEXING_NEW_FILES,
						cond: context => !isLastFilePath(context),
						actions: assign({
							currentFileIndexing: context => context.currentFileIndexing + 1,
						}),
					},
					{
						target: IndexNewFilesState.INDEXING_SUCCESS_IDLE,
						cond: context => isLastFilePath(context),
						actions: assign({
							enterLabel: 'continue',
						}),
					},
				],
				onError: {
					target: IndexNewFilesState.INDEXING_ERROR_IDLE,
					actions: assign({
						errorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
					}),
				},
			},
			exit: [
				assign({isLoading: initialIndexRepositoryMachineContext.isLoading}),
			],
		},
		[IndexNewFilesState.INDEXING_SUCCESS_IDLE]: {
			entry: [assign({isSuccess: true})],
			on: {
				[IndexNewFilesEvent.ENTER_KEY_PRESSED]: {
					actions: context => {
						if (context.navigate) {
							context.navigate(AppState.DO_CHECKSUMS_MATCH);
						}
					},
				},
			},
			exit: [
				assign({isSuccess: initialIndexRepositoryMachineContext.isSuccess}),
			],
		},
		[IndexNewFilesState.INDEXING_ERROR_IDLE]: {
			entry: [assign({isError: true, enterLabel: 'retry'})],
			on: {
				[IndexNewFilesEvent.ENTER_KEY_PRESSED]: {
					target: IndexNewFilesState.INDEXING_NEW_FILES,
				},
			},
			exit: [
				assign({
					isError: initialIndexRepositoryMachineContext.isError,
					enterLabel: initialIndexRepositoryMachineContext.enterLabel,
				}),
			],
		},
	},
});
