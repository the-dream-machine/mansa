import {assign, createMachine} from 'xstate';

import {getRepoDetails} from '../scripts/getRepoDetails.js';
import {getRepoFilePaths} from '../scripts/getRepoFilePaths.js';
import {parseFile} from '../utils/parseFile.js';
import {saveFileEmbeddings} from '../utils/saveFileEmbeddings.js';
import {registerRepo} from '../scripts/registerRepo.js';

// Context
export interface IndexRepoMachineContext {
	filePaths: string[];
	currentFileIndexing: number;
	repoName: string;
}

// States
export enum IndexRepoState {
	IDLE = 'IDLE',
	FETCHING_REPO_DETAILS = 'FETCHING_REPO_DETAILS',
	FETCHING_FILE_PATHS = 'FETCHING_FILE_PATHS',
	INDEXING_REPO_FILE = 'INDEXING_REPO_FILE',
	REGISTER_REPO = 'REGISTER_REPO',
	INDEXING_SUCCESS_IDLE = 'INDEXING_SUCCESS_IDLE',
	INDEXING_ERROR_IDLE = 'INDEXING_ERROR_IDLE',
}

//  State machine states
export type IndexRepoMachineState =
	| {value: IndexRepoState.IDLE; context: IndexRepoMachineContext}
	| {
			value: IndexRepoState.FETCHING_REPO_DETAILS;
			context: IndexRepoMachineContext;
	  }
	| {
			value: IndexRepoState.FETCHING_FILE_PATHS;
			context: IndexRepoMachineContext;
	  }
	| {value: IndexRepoState.INDEXING_REPO_FILE; context: IndexRepoMachineContext}
	| {value: IndexRepoState.REGISTER_REPO; context: IndexRepoMachineContext}
	| {
			value: IndexRepoState.INDEXING_SUCCESS_IDLE;
			context: IndexRepoMachineContext;
	  }
	| {
			value: IndexRepoState.INDEXING_ERROR_IDLE;
			context: IndexRepoMachineContext;
	  };

//  State machine events
export type IndexRepoMachineEvent = {type: 'ENTER_PRESSED'};

// Guards
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isLastFilePath = (context: IndexRepoMachineContext, event: unknown) =>
	context.filePaths.length - 1 === context.currentFileIndexing;

export const indexRepoMachine = createMachine<
	IndexRepoMachineContext,
	IndexRepoMachineEvent,
	IndexRepoMachineState
>({
	/** @xstate-layout N4IgpgJg5mDOIC5QEsB2EwA8BiyA2cAsgIYDGAFmmAHQVikDWaUAygC7FsCusAxBAHtUNNADcBDEeiy4CsEhSq1y9JqlYdusBGIGlOyIQG0ADAF1TZxKAAOA2MjaHU1kJkQAmEwE5qAFm8AZj8ANj8PAA4IgEZAj2iPABoQAE9PUOoAdgiTaIiPTMyTPwi4gF8y5LQMHHwiMkphZVVmdk4eXjAAJy6BLuobPE4AMz6AW2pqmTr5BqU6RlbNHh1UcX0nY3NLVzsHTZckN08ffyDQ8KjY+KTUxDyI6g9vEwBWKO9Cj0CQ19eKqrSWpyBSNEQQAi8ACiADkACpQgBKAH0AAqIqEsFhQgAiOyOe0czlc7gQfkyvm8AWi2UCb1+mRCyTSCDyISyEW85y80VCr0KAJAU2B9UUTWGYDYYqgsjAqM45D4giaukkkyBstmYpoEqljRldXlbEVq3WBi2FnMu3sRKEJMQEXJ1Dir1CUT80VeDOZ91+1C9r0+Hpi8U9mUFws1oKUNmIXQc6gAwgIMPwhFJxGrIzNo01Y-HmMmMKa9ObUJZ8bYbQd7azciZqAkAsEQtlMrzAj6EDFnR5nh3XTkQt5-oLUCm4K5syC5sJrftiUdSQBaJl3BCr6gmbc73e78OVIUanOzmgLNQadrwAnVxegUnhLs0zJZEJ0jyvQIREI0kImCIRseM7atQwiYGw8owPOtqHPeiCBPyzqFF63hvh4ITfIyXYeH4rz+OSJQFBEgbPL8gE1FGp6TBCYDQTWS7wZkfjOoEgRUvyJjBNExRPt+1AjhSPhUtE0Qjt45HTMBYLULq0qykaip0XexwICEalPGERHbpk3yBNET5vv6fh6ZynJMfkjISSKWrSfmCZQEWtE3gudoMQgXK+Jkn75BEOm-IGmRPtk-qoQhvmia8Ph+BUFRAA */
	id: 'indexRepoMachine',
	predictableActionArguments: true,
	initial: IndexRepoState.FETCHING_REPO_DETAILS,
	context: {
		repoName: '',
		filePaths: [],
		currentFileIndexing: 0,
	},
	states: {
		[IndexRepoState.FETCHING_REPO_DETAILS]: {
			invoke: {
				src: async () => await getRepoDetails(),
				onDone: {
					target: IndexRepoState.IDLE,
					actions: assign({
						repoName: (context, event) => event.data.name,
					}),
				},
			},
		},
		[IndexRepoState.IDLE]: {
			on: {
				ENTER_PRESSED: IndexRepoState.FETCHING_FILE_PATHS,
			},
		},
		[IndexRepoState.FETCHING_FILE_PATHS]: {
			invoke: {
				src: async () => await getRepoFilePaths(),
				onDone: {
					target: IndexRepoState.INDEXING_REPO_FILE,
					actions: assign({
						filePaths: (context, event) => event.data,
					}),
				},
			},
		},
		[IndexRepoState.INDEXING_REPO_FILE]: {
			invoke: {
				src: async (context, e) => {
					const currentFile =
						context.filePaths[context.currentFileIndexing] ?? '';
					const parsedFile = await parseFile(currentFile);
					return await saveFileEmbeddings({
						document: parsedFile,
						collectionName: context.repoName,
					});
				},
				onDone: [
					{
						// Loop until all files are indexed
						target: IndexRepoState.INDEXING_REPO_FILE,
						cond: (context, event) => !isLastFilePath(context, event),
						actions: assign({
							currentFileIndexing: context => context.currentFileIndexing + 1,
						}),
					},
					{
						target: IndexRepoState.REGISTER_REPO,
						cond: (context, event) => isLastFilePath(context, event),
					},
				],
			},
		},
		[IndexRepoState.REGISTER_REPO]: {
			invoke: {
				src: async (context, e) =>
					await registerRepo({
						repo: context.repoName,
						filePaths: context.filePaths,
					}),
				onDone: {
					target: IndexRepoState.INDEXING_SUCCESS_IDLE,
				},
			},
		},
		[IndexRepoState.INDEXING_SUCCESS_IDLE]: {
			on: {
				ENTER_PRESSED: {
					actions: () => {
						// TODO: Go to next page (SELECT_OPTION)
						console.log('HOORAAYY! 🎉');
					},
				},
			},
		},
	},
});
