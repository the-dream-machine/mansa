import {type Sender, assign, createMachine, type DoneInvokeEvent} from 'xstate';
import {v4 as uuid} from 'uuid';

import {getRepositoryDetails} from '../utils/repository/getRepositoryDetails.js';
import {getRepositoryFilePaths} from '../utils/repository/getRepositoryFilePaths.js';
import {AppState, type NavigationMachineEvent} from './navigationMachine.js';
import {fishcakeUserPath} from '../utils/fishcakePath.js';
import {writeToFile} from '../utils/writeToFile.js';
import {updateRepositoryChecksums} from '../utils/repository/updateRepositoryChecksums.js';
import {updateRepositoryMap} from '../utils/repository/updateRepositoryMap.js';
import {type Repo} from '../types/Repo.js';

// Context
interface IndexRepositoryMachineContext {
	repositoryName: string;
	filePaths: string[];
	currentFileIndexing: number;
	indexRepositoryErrorMessage: string;
	indexRepositoryErrorLogPath: string;
	enterLabel: 'start indexing' | 'continue' | 'retry';
	navigate?: Sender<NavigationMachineEvent>;
}

// States
export enum IndexRepositoryState {
	IDLE = 'IDLE',
	FETCHING_REPO_DETAILS = 'FETCHING_REPO_DETAILS',
	FETCHING_FILE_PATHS = 'FETCHING_FILE_PATHS',
	INDEXING_REPO_FILES = 'INDEXING_REPO_FILES',
	INDEXING_SUCCESS_IDLE = 'INDEXING_SUCCESS_IDLE',
	INDEXING_ERROR_IDLE = 'INDEXING_ERROR_IDLE',
	WRITING_ERROR_FILE = 'WRITING_ERROR_FILE',
}

//  State machine states
type IndexRepositoryMachineState =
	| {value: IndexRepositoryState.IDLE; context: IndexRepositoryMachineContext}
	| {
			value: IndexRepositoryState.FETCHING_REPO_DETAILS;
			context: IndexRepositoryMachineContext;
	  }
	| {
			value: IndexRepositoryState.FETCHING_FILE_PATHS;
			context: IndexRepositoryMachineContext;
	  }
	| {
			value: IndexRepositoryState.INDEXING_REPO_FILES;
			context: IndexRepositoryMachineContext;
	  }
	| {
			value: IndexRepositoryState.INDEXING_SUCCESS_IDLE;
			context: IndexRepositoryMachineContext;
	  }
	| {
			value: IndexRepositoryState.INDEXING_ERROR_IDLE;
			context: IndexRepositoryMachineContext;
	  }
	| {
			value: IndexRepositoryState.WRITING_ERROR_FILE;
			context: IndexRepositoryMachineContext;
	  };

export enum IndexRepositoryEvent {
	ENTER_PRESSED = 'ENTER_PRESSED',
}

//  State machine events
type IndexRepositoryMachineEvent = {type: IndexRepositoryEvent.ENTER_PRESSED};

// Guards
const isLastFilePath = (context: IndexRepositoryMachineContext) =>
	context.filePaths.length - 1 === context.currentFileIndexing;

export const indexRepositoryMachine = createMachine<
	IndexRepositoryMachineContext,
	IndexRepositoryMachineEvent,
	IndexRepositoryMachineState
>({
	/** @xstate-layout N4IgpgJg5mDOIC5QEsB2EwA8BiyA2cAsgIYDGAFmmAHQVikDWaUAygC7FsCusAxBAHtUNNADcBDEeiy4CsEhSq1y9JqlYdusBGIGlOyIQG0ADAF1TZxKAAOA2MjaHU1kJkQAmEwE5qAFm8AZj8ANj8PAA4IgEZAj2iPABoQAE9PUOoAdgiTaIiPTMyTPwi4gF8y5LQMHHwiMkphZVVmdk4eXjAAJy6BLuobPE4AMz6AW2pqmTr5BqU6RlbNHh1UcX0nY3NLVzsHTZckN08ffyDQ8KjY+KTUxDyI6g9vEwBWKO9Cj0CQ19eKqrSWpyBSNEQQAi8ACiADkACpQgBKAH0AAqIqEsFhQgAiOyOe0czlc7gQfkyvm8AWi2UCb1+mRCyTSCDyISyEW85y80VCr0KAJAU2B9UUTWGYDYYqgsjAqM45D4giaukkkyBstmYpoEqljRldXlbEVq3WBi2FnMu3sRKEJMQEXJ1Dir1CUT80VeDOZ91+1C9r0+Hpi8U9mUFws1oKUNmIXQc6gAwgIMPwhFJxGrIzNo01Y-HmMmMKa9ObUJZ8bYbQd7azciZqAkAsEQtlMrzAj6EDFnR5nh3XTkQt5-oLUCm4K5syC5sJrftiUdSQBaJl3BCr6gmbc73e78OVIUanOzmgLNQadrwAnVxegUnhLs0zJZEJ0jyvQIREI0kImCIRseM7atQwiYGw8owPOtqHPeiCBPyzqFF63hvh4ITfIyXYeH4rz+OSJQFBEgbPL8gE1FGp6TBCYDQTWS7wZkfjOoEgRUvyJjBNExRPt+1AjhSPhUtE0Qjt45HTMBYLULq0qykaip0XexwICEalPGERHbpk3yBNET5vv6fh6ZynJMfkjISSKWrSfmCZQEWtE3gudoMQgXK+Jkn75BEOm-IGmRPtk-qoQhvmia8Ph+BUFRAA */
	id: 'indexRepositoryMachine',
	predictableActionArguments: true,
	initial: IndexRepositoryState.FETCHING_REPO_DETAILS,
	context: {
		repositoryName: 'your repo',
		filePaths: [],
		indexRepositoryErrorMessage: '',
		indexRepositoryErrorLogPath: '',
		currentFileIndexing: 0,
		enterLabel: 'start indexing',
	},
	states: {
		[IndexRepositoryState.FETCHING_REPO_DETAILS]: {
			invoke: {
				src: async () => await getRepositoryDetails(),
				onDone: {
					target: IndexRepositoryState.IDLE,
					actions: assign({
						repositoryName: (_, event: DoneInvokeEvent<Repo>) =>
							event.data.name,
					}),
				},
				onError: {
					target: IndexRepositoryState.WRITING_ERROR_FILE,
					actions: assign({
						indexRepositoryErrorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
						indexRepositoryErrorLogPath: `${fishcakeUserPath}/logs/index_repo_error_${uuid()}.log`,
					}),
				},
			},
		},
		[IndexRepositoryState.IDLE]: {
			on: {
				ENTER_PRESSED: IndexRepositoryState.FETCHING_FILE_PATHS,
			},
		},
		[IndexRepositoryState.FETCHING_FILE_PATHS]: {
			invoke: {
				src: async () => await getRepositoryFilePaths(),
				onDone: {
					target: IndexRepositoryState.INDEXING_REPO_FILES,
					actions: assign({
						filePaths: (_, event: DoneInvokeEvent<string[]>) => event.data,
					}),
				},
				onError: {
					target: IndexRepositoryState.WRITING_ERROR_FILE,
					actions: assign({
						indexRepositoryErrorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
						indexRepositoryErrorLogPath: context =>
							`${fishcakeUserPath}/logs/index_${
								context.repositoryName
							}_repo_error_${uuid()}.log`,
					}),
				},
			},
		},
		[IndexRepositoryState.INDEXING_REPO_FILES]: {
			invoke: {
				src: async context => {
					const filePath = context.filePaths[context.currentFileIndexing] ?? '';
					await updateRepositoryMap({filePath});
					await updateRepositoryChecksums({filePath});
				},
				onDone: [
					{
						// Loop until all files are indexed
						target: IndexRepositoryState.INDEXING_REPO_FILES,
						cond: context => !isLastFilePath(context),
						actions: assign({
							currentFileIndexing: context => context.currentFileIndexing + 1,
						}),
					},
					{
						target: IndexRepositoryState.INDEXING_SUCCESS_IDLE,
						cond: context => isLastFilePath(context),
						actions: assign({
							enterLabel: 'continue',
						}),
					},
				],
				onError: {
					target: IndexRepositoryState.WRITING_ERROR_FILE,
					actions: assign({
						indexRepositoryErrorMessage: (_, event: DoneInvokeEvent<Error>) =>
							event.data.message,
						indexRepositoryErrorLogPath: context =>
							`${fishcakeUserPath}/logs/index_${
								context.repositoryName
							}_repo_error_${uuid()}.log`,
					}),
				},
			},
		},
		[IndexRepositoryState.INDEXING_SUCCESS_IDLE]: {
			on: {
				[IndexRepositoryEvent.ENTER_PRESSED]: {
					actions: context => {
						if (context.navigate) {
							context.navigate(AppState.DOES_MAP_EXIST);
						}
					},
				},
			},
		},
		[IndexRepositoryState.WRITING_ERROR_FILE]: {
			invoke: {
				src: async context =>
					await writeToFile({
						filePath: context.indexRepositoryErrorLogPath,
						fileContent: context.indexRepositoryErrorMessage,
					}),
				onDone: {
					target: IndexRepositoryState.INDEXING_ERROR_IDLE,
					actions: assign({
						enterLabel: 'retry',
					}),
				},
			},
		},
		[IndexRepositoryState.INDEXING_ERROR_IDLE]: {
			on: {
				[IndexRepositoryEvent.ENTER_PRESSED]: {
					target: IndexRepositoryState.FETCHING_REPO_DETAILS,
				},
			},
		},
	},
});
