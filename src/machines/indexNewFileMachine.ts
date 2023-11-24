import {type DoneInvokeEvent, assign, createMachine, type Sender} from 'xstate';
import {v4 as uuid} from 'uuid';

import {updateRepositoryChecksums} from '../utils/repository/updateRepositoryChecksums.js';
import {updateRepositoryMap} from '../utils/repository/updateRepositoryMap.js';
import {fishcakeUserPath} from '../utils/fishcakePath.js';
import {writeToFile} from '../utils/writeToFile.js';
import {AppState, type NavigationMachineEvent} from './navigationMachine.js';
import {compareAllChecksums} from '../utils/compareAllChecksums.js';

interface IndexNewFileMachineContext {
	filePaths: string[];
	currentFileIndexing: number;
	enterLabel: string;
	repositoryName: string;
	indexRepositoryErrorMessage: string;
	indexRepositoryErrorLogPath: string;
	navigate?: Sender<NavigationMachineEvent>;
}

export enum IndexNewFileState {
	COMPARING_CHECKSUMS = 'COMPARING_CHECKSUMS',
	IDLE = 'IDLE',
	INDEXING_NEW_FILES = 'INDEXING_NEW_FILES',
	INDEXING_SUCCESS_IDLE = 'INDEXING_SUCCESS_IDLE',
	INDEXING_ERROR_IDLE = 'INDEXING_ERROR_IDLE',
	WRITING_ERROR_FILE = 'WRITING_ERROR_FILE',
}
type IndexNewFileMachineState =
	| {
			value: IndexNewFileState.COMPARING_CHECKSUMS;
			context: IndexNewFileMachineContext;
	  }
	| {
			value: IndexNewFileState.IDLE;
			context: IndexNewFileMachineContext;
	  }
	| {
			value: IndexNewFileState.INDEXING_NEW_FILES;
			context: IndexNewFileMachineContext;
	  }
	| {
			value: IndexNewFileState.INDEXING_SUCCESS_IDLE;
			context: IndexNewFileMachineContext;
	  }
	| {
			value: IndexNewFileState.INDEXING_ERROR_IDLE;
			context: IndexNewFileMachineContext;
	  }
	| {
			value: IndexNewFileState.WRITING_ERROR_FILE;
			context: IndexNewFileMachineContext;
	  };

export enum IndexNewFileEvent {
	ENTER_KEY_PRESSED = 'ENTER_KEY_PRESSED ',
}
type IndexNewFileMachineEvent = {type: IndexNewFileEvent.ENTER_KEY_PRESSED};

// Guards
const isLastFilePath = (context: IndexNewFileMachineContext) =>
	context.filePaths.length - 1 === context.currentFileIndexing;

export const indexNewFileMachine = createMachine<
	IndexNewFileMachineContext,
	IndexNewFileMachineEvent,
	IndexNewFileMachineState
>({
	id: 'indexNewFileMachine',
	predictableActionArguments: true,
	preserveActionOrder: true,
	initial: IndexNewFileState.COMPARING_CHECKSUMS,
	context: {
		filePaths: [],
		currentFileIndexing: 0,
		enterLabel: 'start indexing',
		repositoryName: '',
		indexRepositoryErrorMessage: '',
		indexRepositoryErrorLogPath: '',
	},
	states: {
		[IndexNewFileState.COMPARING_CHECKSUMS]: {
			invoke: {
				src: async () => await compareAllChecksums(),
				onDone: {
					target: IndexNewFileState.IDLE,
					actions: assign({
						filePaths: (_, event: DoneInvokeEvent<string[]>) => event.data,
					}),
				},
				onError: {
					target: IndexNewFileState.WRITING_ERROR_FILE,
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
		[IndexNewFileState.IDLE]: {
			on: {
				[IndexNewFileEvent.ENTER_KEY_PRESSED]: {
					target: IndexNewFileState.INDEXING_NEW_FILES,
				},
			},
		},
		[IndexNewFileState.INDEXING_NEW_FILES]: {
			invoke: {
				src: async context => {
					const filePath = context.filePaths[context.currentFileIndexing] ?? '';
					await updateRepositoryMap({filePath});
					await updateRepositoryChecksums({filePath});
				},
				onDone: [
					{
						// Loop until all files are indexed
						target: IndexNewFileState.INDEXING_NEW_FILES,
						cond: context => !isLastFilePath(context),
						actions: assign({
							currentFileIndexing: context => context.currentFileIndexing + 1,
						}),
					},
					{
						target: IndexNewFileState.INDEXING_SUCCESS_IDLE,
						cond: context => isLastFilePath(context),
						actions: assign({
							enterLabel: 'continue',
						}),
					},
				],
				onError: {
					target: IndexNewFileState.WRITING_ERROR_FILE,
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
		[IndexNewFileState.INDEXING_SUCCESS_IDLE]: {
			on: {
				[IndexNewFileEvent.ENTER_KEY_PRESSED]: {
					actions: context => {
						if (context.navigate) {
							context.navigate(AppState.DO_CHECKSUMS_MATCH);
						}
					},
				},
			},
		},
		[IndexNewFileState.WRITING_ERROR_FILE]: {
			invoke: {
				src: async context =>
					await writeToFile({
						filePath: context.indexRepositoryErrorLogPath,
						fileContent: context.indexRepositoryErrorMessage,
					}),
				onDone: {
					target: IndexNewFileState.INDEXING_ERROR_IDLE,
					actions: assign({
						enterLabel: 'retry',
					}),
				},
			},
		},
		[IndexNewFileState.INDEXING_ERROR_IDLE]: {
			on: {
				[IndexNewFileEvent.ENTER_KEY_PRESSED]: {
					target: IndexNewFileState.INDEXING_NEW_FILES,
				},
			},
		},
	},
});
