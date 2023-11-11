import {type Sender, assign, createMachine} from 'xstate';
import {v4 as uuid} from 'uuid';

import {getRepositoryDetails} from '../utils/getRepositoryDetails.js';
import {getRepoFilePaths} from '../scripts/getRepoFilePaths.js';
import {parseFile} from '../utils/parseFile.js';
import {saveFileEmbeddings} from '../utils/saveFileEmbeddings.js';
import {createFishcakeConfig} from '../utils/createFishcakeConfig.js';
import {AppState, type NavigationMachineEvent} from './navigationMachine.js';
import {fishcakeUserPath} from '../utils/fishcakePath.js';
import {writeFile} from '../utils/writeFile.js';
import {parseCodeFile} from '../utils/parseCodeFile.js';
import {getEmbeddingFunction} from '../utils/embeddingFunction.js';
import {chroma} from '../utils/chroma.js';

// Context
interface IndexRepoMachineContext {
	repoName: string;
	filePaths: string[];
	currentFileIndexing: number;
	indexErrorMessage: string;
	indexErrorLogPath: string;
	enterLabel: 'start indexing' | 'continue' | 'retry';
	navigate?: Sender<NavigationMachineEvent>;
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
	WRITING_ERROR_FILE = 'WRITING_ERROR_FILE',
}

//  State machine states
type IndexRepoMachineState =
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
	  }
	| {
			value: IndexRepoState.WRITING_ERROR_FILE;
			context: IndexRepoMachineContext;
	  };

export enum IndexRepoEvent {
	ENTER_PRESSED = 'ENTER_PRESSED',
}

//  State machine events
type IndexRepoMachineEvent = {type: IndexRepoEvent.ENTER_PRESSED};

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
		repoName: 'your repo',
		filePaths: [],
		indexErrorMessage: '',
		indexErrorLogPath: '',
		currentFileIndexing: 0,
		enterLabel: 'start indexing',
	},
	states: {
		[IndexRepoState.FETCHING_REPO_DETAILS]: {
			invoke: {
				src: async () => await getRepositoryDetails(),
				onDone: {
					target: IndexRepoState.IDLE,
					actions: assign({
						repoName: (_, event) => event.data.name,
					}),
				},
				onError: {
					target: IndexRepoState.WRITING_ERROR_FILE,
					actions: assign({
						indexErrorMessage: (_, event) => event.data.message,
						indexErrorLogPath: `${fishcakeUserPath}/logs/index_repo_error_${uuid()}.log`,
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
						filePaths: (_, event) => event.data,
					}),
				},
				onError: {
					target: IndexRepoState.WRITING_ERROR_FILE,
					actions: assign({
						indexErrorMessage: (_, event) => event.data.message,
						indexErrorLogPath: context =>
							`${fishcakeUserPath}/logs/index_${
								context.repoName
							}_repo_error_${uuid()}.log`,
					}),
				},
			},
		},
		[IndexRepoState.INDEXING_REPO_FILE]: {
			invoke: {
				src: async context => {
					const currentFilePath =
						context.filePaths[context.currentFileIndexing] ?? '';
					console.log('🌱 # currentFilePath:', currentFilePath);
					// const parsedFile = await parseFile(currentFile);
					const parsedCodeFile = await parseCodeFile({
						filePath: currentFilePath,
					});
					console.log('🌱 # parsedFile:', parsedCodeFile);

					const embeddingFunction = await getEmbeddingFunction();
					const collection = await chroma.getOrCreateCollection({
						embeddingFunction,
						name: context.repoName,
						metadata: {
							description: 'repo_tree_summary',
						},
					});

					const result = await collection.add({
						ids: [`${parsedCodeFile.filePath}_${uuid()}`],
						metadatas: [
							{
								filePath: parsedCodeFile.filePath,
								relations: parsedCodeFile.relations.join(','),
							},
						],
						documents: [parsedCodeFile.fileSummary],
					});
					console.log('🌱 # Add collection result:', result);
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
				onError: {
					target: IndexRepoState.WRITING_ERROR_FILE,
					actions: assign({
						indexErrorMessage: (_, event) => event.data.message,
						indexErrorLogPath: context =>
							`${fishcakeUserPath}/logs/index_${
								context.repoName
							}_repo_error_${uuid()}.log`,
					}),
				},
			},
		},
		[IndexRepoState.REGISTER_REPO]: {
			invoke: {
				src: async context =>
					await createFishcakeConfig({
						packageManager: 'bun', // Placeholder to make TS compiler happy
					}),
				onDone: {
					target: IndexRepoState.INDEXING_SUCCESS_IDLE,
					actions: assign({
						enterLabel: 'continue',
					}),
				},
			},
		},
		[IndexRepoState.INDEXING_SUCCESS_IDLE]: {
			on: {
				[IndexRepoEvent.ENTER_PRESSED]: {
					actions: context => {
						if (context.navigate) {
							context.navigate(AppState.IS_REPO_INDEXED);
						}
					},
				},
			},
		},
		[IndexRepoState.WRITING_ERROR_FILE]: {
			invoke: {
				src: async context =>
					await writeFile({
						filePath: context.indexErrorLogPath,
						fileContent: context.indexErrorMessage,
					}),
				onDone: {
					target: IndexRepoState.INDEXING_ERROR_IDLE,
					actions: assign({
						enterLabel: 'retry',
					}),
				},
			},
		},
		[IndexRepoState.INDEXING_ERROR_IDLE]: {
			on: {
				[IndexRepoEvent.ENTER_PRESSED]: {
					target: IndexRepoState.FETCHING_REPO_DETAILS,
				},
			},
		},
	},
});
