import {type DoneInvokeEvent, assign, createMachine, type Sender} from 'xstate';
import {v4 as uuid} from 'uuid';

import {updateRepositoryChecksums} from '../utils/repository/updateRepositoryChecksums.js';
import {updateRepositoryMap} from '../utils/repository/updateRepositoryMap.js';
import {fishcakeUserPath} from '../utils/fishcakePath.js';
import {writeToFile} from '../utils/writeToFile.js';
import {AppState, type NavigationMachineEvent} from './navigationMachine.js';
import {compareAllChecksums} from '../utils/compareAllChecksums.js';

interface IndexNewFilesMachineContext {
	filePaths: string[];
	currentFileIndexing: number;
	enterLabel: string;
	repositoryName: string;
	indexRepositoryErrorMessage: string;
	indexRepositoryErrorLogPath: string;
	navigate?: Sender<NavigationMachineEvent>;
}

export enum IndexNewFilesState {
	COMPARING_CHECKSUMS = 'COMPARING_CHECKSUMS',
	IDLE = 'IDLE',
	INDEXING_NEW_FILES = 'INDEXING_NEW_FILES',
	INDEXING_SUCCESS_IDLE = 'INDEXING_SUCCESS_IDLE',
	INDEXING_ERROR_IDLE = 'INDEXING_ERROR_IDLE',
	WRITING_ERROR_FILE = 'WRITING_ERROR_FILE',
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
	  }
	| {
			value: IndexNewFilesState.WRITING_ERROR_FILE;
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
	context: {
		filePaths: [],
		currentFileIndexing: 0,
		enterLabel: 'start indexing',
		repositoryName: '',
		indexRepositoryErrorMessage: '',
		indexRepositoryErrorLogPath: '',
	},
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
					target: IndexNewFilesState.WRITING_ERROR_FILE,
					actions: assign({
						indexRepositoryErrorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
						indexRepositoryErrorLogPath: context =>
							`${fishcakeUserPath}/logs/index_${
								context.repositoryName
							}_error_${uuid()}.log`,
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
					target: IndexNewFilesState.WRITING_ERROR_FILE,
					actions: assign({
						indexRepositoryErrorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
						indexRepositoryErrorLogPath: context =>
							`${fishcakeUserPath}/logs/index_${
								context.repositoryName
							}_error_${uuid()}.log`,
					}),
				},
			},
		},
		[IndexNewFilesState.INDEXING_SUCCESS_IDLE]: {
			on: {
				[IndexNewFilesEvent.ENTER_KEY_PRESSED]: {
					actions: context => {
						if (context.navigate) {
							context.navigate(AppState.DO_CHECKSUMS_MATCH);
						}
					},
				},
			},
		},
		[IndexNewFilesState.WRITING_ERROR_FILE]: {
			invoke: {
				src: async context =>
					await writeToFile({
						filePath: context.indexRepositoryErrorLogPath,
						fileContent: context.indexRepositoryErrorMessage,
					}),
				onDone: {
					target: IndexNewFilesState.INDEXING_ERROR_IDLE,
					actions: assign({
						enterLabel: 'retry',
					}),
				},
			},
		},
		[IndexNewFilesState.INDEXING_ERROR_IDLE]: {
			on: {
				[IndexNewFilesEvent.ENTER_KEY_PRESSED]: {
					target: IndexNewFilesState.INDEXING_NEW_FILES,
				},
			},
		},
	},
});
