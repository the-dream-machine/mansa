import {type Sender, assign, createMachine} from 'xstate';
import {v4 as uuid} from 'uuid';

import {downloadEmbeddingModelMetadata} from '../utils/downloadModelMetadata.js';
import {downloadModel} from '../utils/downloadModel.js';
import {writeFile} from '../utils/writeFile.js';
import {fishcakePath} from '../utils/fishcakePath.js';
import {AppState, type NavigationMachineEvent} from './navigationMachine.js';

// Context
interface DownloadModelMachineContext {
	downloadProgress: number;
	downloadSpeed: number;
	downloadErrorMessage: string;
	downloadErrorLogPath: string;
	enterLabel: 'download' | 'continue' | 'retry';
	navigate?: Sender<NavigationMachineEvent>;
}

// States
export enum DownloadModelState {
	IDLE = 'IDLE',
	DOWNLOADING_MODEL_METADATA = 'DOWNLOADING_MODEL_METADATA',
	DOWNLOADING_MODEL = 'DOWNLOADING_MODEL',
	DOWNLOAD_SUCCESSFUL_IDLE = 'DOWNLOAD_SUCCESSFUL_IDLE',
	DOWNLOAD_ERROR_IDLE = 'DOWNLOAD_ERROR_IDLE',
	WRITING_ERROR_FILE = 'WRITING_ERROR_FILE',
}

type DownloadModelMachineState =
	| {
			value: DownloadModelState.IDLE;
			context: DownloadModelMachineContext;
	  }
	| {
			value: DownloadModelState.DOWNLOADING_MODEL_METADATA;
			context: DownloadModelMachineContext;
	  }
	| {
			value: DownloadModelState.DOWNLOADING_MODEL;
			context: DownloadModelMachineContext;
	  }
	| {
			value: DownloadModelState.DOWNLOAD_SUCCESSFUL_IDLE;
			context: DownloadModelMachineContext;
	  }
	| {
			value: DownloadModelState.DOWNLOAD_ERROR_IDLE;
			context: DownloadModelMachineContext;
	  }
	| {
			value: DownloadModelState.WRITING_ERROR_FILE;
			context: DownloadModelMachineContext;
	  };

// Events
export enum DownloadModelEvent {
	ENTER_PRESSED = 'ENTER_PRESSED',
	PROGRESS = 'PROGRESS',
}

export type DownloadModelMachineEvent =
	| {
			type: DownloadModelEvent.ENTER_PRESSED;
	  }
	| {
			type: DownloadModelEvent.PROGRESS;
			data: {progress: number; speed: number};
	  };

export const downloadModelMachine = createMachine<
	DownloadModelMachineContext,
	DownloadModelMachineEvent,
	DownloadModelMachineState
>({
	/** @xstate-layout N4IgpgJg5mDOIC5QEsB2EwA8BiyA2cAsgIYDGAFmmAHQVikDWaUAygC7FsCusAxBAHtUNNADcBDEeiy4CsEhSq1y9JqlYdusBGIGlOyIQG0ADAF1TZxKAAOA2MjaHU1kJkQAmEwE5qAFm8AZj8ANj8PAA4IgEZAj2iPABoQAE9PUOoAdgiTaIiPTMyTPwi4gF8y5LQMHHwiMkphZVVmdk4eXjAAJy6BLuobPE4AMz6AW2pqmTr5BqU6RlbNHh1UcX0nY3NLVzsHTZckN08ffyDQ8KjY+KTUxDyI6g9vEwBWKO9Cj0CQ19eKqrSWpyBSNEQQAi8ACiADkACpQgBKAH0AAqIqEsFhQgAiOyOe0czlc7gQfkyvm8AWi2UCb1+mRCyTSCDyISyEW85y80VCr0KAJAU2B9UUTWGYDYYqgsjAqM45D4giaukkkyBstmYpoEqljRldXlbEVq3WBi2FnMu3sRKEJMQEXJ1Dir1CUT80VeDOZ91+1C9r0+Hpi8U9mUFws1oKUNmIXQc6gAwgIMPwhFJxGrIzNo01Y-HmMmMKa9ObUJZ8bYbQd7azciZqAkAsEQtlMrzAj6EDFnR5nh3XTkQt5-oLUCm4K5syC5sJrftiUdSQBaJl3BCr6gmbc73e78OVIUanOzmgLNQadrwAnVxegUnhLs0zJZEJ0jyvQIREI0kImCIRseM7atQwiYGw8owPOtqHPeiCBPyzqFF63hvh4ITfIyXYeH4rz+OSJQFBEgbPL8gE1FGp6TBCYDQTWS7wZkfjOoEgRUvyJjBNExRPt+1AjhSPhUtE0Qjt45HTMBYLULq0qykaip0XexwICEalPGERHbpk3yBNET5vv6fh6ZynJMfkjISSKWrSfmCZQEWtE3gudoMQgXK+Jkn75BEOm-IGmRPtk-qoQhvmia8Ph+BUFRAA */
	id: 'downloadModelMachine',
	predictableActionArguments: true,
	initial: DownloadModelState.IDLE,
	context: {
		downloadProgress: 0,
		downloadSpeed: 0,
		downloadErrorMessage: '',
		downloadErrorLogPath: '',
		enterLabel: 'download',
	},
	states: {
		[DownloadModelState.IDLE]: {
			on: {
				[DownloadModelEvent.ENTER_PRESSED]: {
					target: DownloadModelState.DOWNLOADING_MODEL_METADATA,
				},
			},
		},
		[DownloadModelState.DOWNLOADING_MODEL_METADATA]: {
			invoke: {
				src: async () => await downloadEmbeddingModelMetadata(),
				onDone: {
					target: DownloadModelState.DOWNLOADING_MODEL,
				},
				onError: {
					target: DownloadModelState.WRITING_ERROR_FILE,
					actions: assign({
						downloadErrorMessage: (_, event) => event.data.message,
						downloadErrorLogPath: `${fishcakePath}/logs/download_model_error_${uuid()}.log`,
					}),
				},
			},
		},
		[DownloadModelState.DOWNLOADING_MODEL]: {
			invoke: {
				src: () => async callback => await downloadModel(callback),
				onDone: {
					target: DownloadModelState.DOWNLOAD_SUCCESSFUL_IDLE,
					actions: assign({
						enterLabel: 'continue',
					}),
				},
				onError: {
					target: DownloadModelState.WRITING_ERROR_FILE,
					actions: assign({
						downloadErrorMessage: (_, event) => event.data.message,
						downloadErrorLogPath: `${fishcakePath}/logs/download_model_error_${uuid()}.log`,
					}),
				},
			},
			on: {
				[DownloadModelEvent.PROGRESS]: {
					actions: assign({
						downloadProgress: (_, event) => event.data.progress,
						downloadSpeed: (_, event) => event.data.speed,
					}),
				},
			},
		},
		[DownloadModelState.DOWNLOAD_SUCCESSFUL_IDLE]: {
			on: {
				[DownloadModelEvent.ENTER_PRESSED]: {
					actions: context => {
						if (context.navigate) {
							context.navigate(AppState.IS_EMBEDDING_MODEL_INSTALLED);
						}
					},
				},
			},
		},
		[DownloadModelState.WRITING_ERROR_FILE]: {
			invoke: {
				src: async context =>
					writeFile({
						filePath: context.downloadErrorLogPath,
						fileContent: context.downloadErrorMessage,
					}),
				onDone: {
					target: DownloadModelState.DOWNLOAD_ERROR_IDLE,
					actions: assign({
						enterLabel: 'retry',
					}),
				},
			},
		},
		[DownloadModelState.DOWNLOAD_ERROR_IDLE]: {
			on: {
				[DownloadModelEvent.ENTER_PRESSED]: {
					target: DownloadModelState.DOWNLOADING_MODEL,
				},
			},
		},
	},
});
