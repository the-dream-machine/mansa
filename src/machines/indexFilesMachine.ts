import {assign, createMachine} from 'xstate';
import {fs} from 'zx';
import {getRepoDetails} from '../scripts/getRepoDetails.js';
import {getRepoFilePaths} from '../scripts/getRepoFilePaths.js';
import {parseFile} from '../utils/parseFile.js';
import {saveFileEmbeddings} from '../utils/saveFileEmbeddings.js';
import {chromaStart} from '../scripts/chroma/chromaStart.js';
import {registerRepo} from '../scripts/registerRepo.js';

// Context
export interface MachineContext {
	filePaths: string[];
	currentFileIndexing: number;
	repoName: string;
}

// States
export enum State {
	STARTING_DATABASE = 'startingDatabase',
	IDLE = 'idle',
	FETCHING_REPO_DETAILS = 'fetchingRepo',
	FETCHING_FILE_PATHS = 'fetchingFilePaths',
	INDEXING_FILES = 'indexingFiles',
	REGISTER_REPO = 'registerRepo',
	INDEXING_SUCCESS_IDLE = 'indexingSuccessIdle',
	INDEXING_ERROR_IDLE = 'indexingErrorIdle',
}

//  State machine states
export type IndexFilesMachineState =
	| {value: State.STARTING_DATABASE; context: MachineContext}
	| {value: State.IDLE; context: MachineContext}
	| {value: State.FETCHING_REPO_DETAILS; context: MachineContext}
	| {value: State.FETCHING_FILE_PATHS; context: MachineContext}
	| {value: State.INDEXING_FILES; context: MachineContext}
	| {value: State.REGISTER_REPO; context: MachineContext}
	| {value: State.INDEXING_SUCCESS_IDLE; context: MachineContext}
	| {value: State.INDEXING_ERROR_IDLE; context: MachineContext};

//  State machine events
export type MachineEvent = {type: 'ENTER_PRESSED'} | {type: 'ESC_PRESSED'};

// Guards
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isLastFilePath = (context: MachineContext, event: unknown) =>
	context.filePaths.length - 1 === context.currentFileIndexing;

export const indexFilesMachine = createMachine<
	MachineContext,
	MachineEvent,
	IndexFilesMachineState
>({
	/** @xstate-layout N4IgpgJg5mDOIC5QEsB2EwA8BiyA2cAsgIYDGAFmmAHQVikDWaUAygC7FsCusAxBAHtUNNADcBDEeiy4CsEhSq1y9JqlYdusBGIGlOyIQG0ADAF1TZxKAAOA2MjaHU1kJkQAmEwE5qAFm8AZj8ANj8PAA4IgEZAj2iPABoQAE9PUOoAdgiTaIiPTMyTPwi4gF8y5LQMHHwiMkphZVVmdk4eXjAAJy6BLuobPE4AMz6AW2pqmTr5BqU6RlbNHh1UcX0nY3NLVzsHTZckN08ffyDQ8KjY+KTUxDyI6g9vEwBWKO9Cj0CQ19eKqrSWpyBSNEQQAi8ACiADkACpQgBKAH0AAqIqEsFhQgAiOyOe0czlc7gQfkyvm8AWi2UCb1+mRCyTSCDyISyEW85y80VCr0KAJAU2B9UUTWGYDYYqgsjAqM45D4giaukkkyBstmYpoEqljRldXlbEVq3WBi2FnMu3sRKEJMQEXJ1Dir1CUT80VeDOZ91+1C9r0+Hpi8U9mUFws1oKUNmIXQc6gAwgIMPwhFJxGrIzNo01Y-HmMmMKa9ObUJZ8bYbQd7azciZqAkAsEQtlMrzAj6EDFnR5nh3XTkQt5-oLUCm4K5syC5sJrftiUdSQBaJl3BCr6gmbc73e78OVIUanOzmgLNQadrwAnVxegUnhLs0zJZEJ0jyvQIREI0kImCIRseM7atQwiYGw8owPOtqHPeiCBPyzqFF63hvh4ITfIyXYeH4rz+OSJQFBEgbPL8gE1FGp6TBCYDQTWS7wZkfjOoEgRUvyJjBNExRPt+1AjhSPhUtE0Qjt45HTMBYLULq0qykaip0XexwICEalPGERHbpk3yBNET5vv6fh6ZynJMfkjISSKWrSfmCZQEWtE3gudoMQgXK+Jkn75BEOm-IGmRPtk-qoQhvmia8Ph+BUFRAA */
	id: 'indexFilesMachine',
	predictableActionArguments: true,
	initial: State.STARTING_DATABASE,
	context: {
		repoName: '',
		filePaths: [],
		currentFileIndexing: 0,
	},
	states: {
		[State.STARTING_DATABASE]: {
			invoke: {
				src: async () => await chromaStart(),
				onDone: {
					target: State.FETCHING_REPO_DETAILS,
				},
			},
		},
		[State.FETCHING_REPO_DETAILS]: {
			invoke: {
				src: async () => await getRepoDetails(),
				onDone: {
					target: State.IDLE,
					actions: assign({
						repoName: (context, event) => event.data.name,
					}),
				},
			},
		},
		[State.IDLE]: {
			on: {
				ENTER_PRESSED: State.FETCHING_FILE_PATHS,
			},
		},
		[State.FETCHING_FILE_PATHS]: {
			invoke: {
				src: async () => await getRepoFilePaths(),
				onDone: {
					target: State.INDEXING_FILES,
					actions: assign({
						filePaths: (context, event) => event.data,
					}),
				},
			},
		},
		[State.INDEXING_FILES]: {
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
						target: State.INDEXING_FILES,
						cond: (context, event) => !isLastFilePath(context, event),
						actions: assign({
							currentFileIndexing: context => context.currentFileIndexing + 1,
						}),
					},
					{
						target: State.REGISTER_REPO,
						cond: (context, event) => isLastFilePath(context, event),
					},
				],
			},
		},
		[State.REGISTER_REPO]: {
			invoke: {
				src: async (context, e) =>
					await registerRepo({
						repo: context.repoName,
						filePaths: context.filePaths,
					}),
				onDone: {
					target: State.INDEXING_SUCCESS_IDLE,
				},
			},
		},
		[State.INDEXING_SUCCESS_IDLE]: {
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
