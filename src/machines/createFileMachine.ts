import {createMachine, assign, type DoneInvokeEvent} from 'xstate';

import * as prettier from 'prettier';
import {highlightAsync} from '../utils/highlightAsync.js';
import loadLanguages from 'prismjs/components/index.js';
import {writeToFile} from '../utils/writeToFile.js';
import {sendParent} from 'xstate/lib/actions.js';
import {StepsEvent} from '../types/StepsMachine.js';
import {sleep} from 'zx';

// Context
export interface CreateFileMachineContext {
	filePath?: string;
	fileExtension?: string;
	rawCode?: string;
	formattedCode?: string;
	highlightedCode?: string;
	enterLabel: string;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	showSuccessSection: boolean;
}

// States
export enum CreateFileState {
	FORMATTING_CODE = 'FORMATTING_CODE',
	HIGHLIGHTING_CODE = 'HIGHLIGHTING_CODE',
	HIGHLIGHTING_UNSUPPORTED_CODE = 'HIGHLIGHTING_UNSUPPORTED_CODE',
	IDLE = 'IDLE',
	CREATING_FILE = 'CREATING_FILE',
	CREATE_FILE_SUCCESS_IDLE = 'CREATE_FILE_SUCCESS_IDLE',
	CREATE_FILE_ERROR_IDLE = 'CREATE_FILE_ERROR_IDLE',
}

//  State machine states
export type CreateFileMachineState =
	| {value: CreateFileState.FORMATTING_CODE; context: CreateFileMachineContext}
	| {
			value: CreateFileState.HIGHLIGHTING_CODE;
			context: CreateFileMachineContext;
	  }
	| {
			value: CreateFileState.HIGHLIGHTING_UNSUPPORTED_CODE;
			context: CreateFileMachineContext;
	  }
	| {value: CreateFileState.IDLE; context: CreateFileMachineContext}
	| {value: CreateFileState.CREATING_FILE; context: CreateFileMachineContext}
	| {
			value: CreateFileState.CREATE_FILE_SUCCESS_IDLE;
			context: CreateFileMachineContext;
	  }
	| {
			value: CreateFileState.CREATE_FILE_ERROR_IDLE;
			context: CreateFileMachineContext;
	  };

export enum CreateFileEvent {
	ENTER_KEY_PRESSED = 'ENTER_KEY_PRESSED',
}

//  State machine events
export type CreateFileMachineEvent = {type: CreateFileEvent.ENTER_KEY_PRESSED};

export const initialCreateFileMachineContext: CreateFileMachineContext = {
	filePath: '',
	fileExtension: '',
	rawCode: '',
	formattedCode: '',
	highlightedCode: '',
	enterLabel: 'create file',
	isLoading: false,
	isSuccess: false,
	isError: false,
	showSuccessSection: false,
};

export const createFileMachine = createMachine<
	CreateFileMachineContext,
	CreateFileMachineEvent,
	CreateFileMachineState
>({
	/** @xstate-layout N4IgpgJg5mDOIC5QGMBOYCGAXMAxAlgDZgCyGyAFvgHZgB0uA8gEokCCAKhwJIByA4gH0AwowAiAUQDEEAPa06NAG6yA1vTSYcBYmUo16TVpx4CR4iQmWzk2fPIDaABgC6zl4lAAHWbHxZ7ak8QAA9EACYAFki6cPCANgBWeKd4gEYATkiAdkSADniAGhAAT0Q0vOy6NNTExPCMhIrIp0iAXzbizWw8IlJyKgUjdi4+IVFJKTBUVFlUOi9CbAAzOYBbOm7tPr1BwxYR03GLK2oVWwDHV3dgnz9LoKRQiOjYhOTUzJz8otLELLo2ScGQAzI08hknHUwWkOl10D0dP19AoABLcfiogAyGNRR3MkzkCms6k2CO2ugGBjo6MxOMx+ImlmsF0C7huTzu-kCwTCCBSILoiScMPiuXiGTS8XCxTKCBBaUSdEiFXikTyILyKpBIOycJAW16lJR9Fp2NxjIsUxmcwWSywq1QG0NSN21LN9LxYwJzLONjsVzcrluvm58l5iAFQpFkrFyVjMr+CDSFToIIacQyavS4TSkRB+pdOypaNxnvxAFVeABlCsABTrLA4EjEPpk8noJI05KNyL2NLLFu9VdrDabLZ9p3OAeo7ODnNDDwjyacGuqkXyufiEIKGVl5Wyguy4ScqQ18XiCoKBc6Bp7rpLpsHDOHNfrjeYzdbTOts3mixWdYyS0Xs3VLOkhzMEd33Hb8ThZGc5w8Bd7h5J4+RqNc803KUdwlfcEDyNI00zVcdTPPJEkLe9ixNOhuDELFpGEZgJE4CRBFwbgmI5bxFzQ0AMIVcI6AyYVEjSKJsnSeo9yTTIlVPRJIQyXInFzcJEnaW8i2NfsWLY-EuKY9tiT9UldL7akDM4b1jN9acHiQkNUPDdDyjVJxYjqXNgTEuo1QIioRPCApjxBS81WySjtPhECHzomyjO46Rpj-O1AKdYDEVo-TWNssx7Knf0nOuec+Ncx5BI8lpvPqGoMn85JIgIqIvOyaSItU3JwhBYUb1vahZAgOBgkssCwBcsMqueBAAFpfjlOalUa1a1vWm84pyvTqWGExvSZKal3chBIkTOUaniUTt3CaSUjOk9NrveLcvdZ8vTMQ6UOm5cwS84EIRSUENzyVIgqcKpQalPzdWhbdqJenbwPNF8oLfMdPwnL6Kp+k7snVa70hVE9QvVRICNBIUiMozTpUu2EdJopH6AYpijoE2bJISWINUoiSOrSaK8iCsTqkPPJNIVb4tKoxnEashQkrslL2bc6rkxyESUzPaL02yLMguyYjcklGNbtNoiEe2hX6CSjj7MEWthGECRq2rQRWYkVWZow-XBV6iUxR6lJFvKUHRMSMEBelbcUytikbboO3OJSwQJGYZgWA9xive+471cFymA6zDr6hD1qwWVfNpXIvNdT1Do2iAA */
	id: 'createFileMachine',
	predictableActionArguments: true,
	initial: CreateFileState.FORMATTING_CODE,
	context: initialCreateFileMachineContext,
	states: {
		[CreateFileState.FORMATTING_CODE]: {
			invoke: {
				src: async context =>
					await prettier.format(context.rawCode ?? '', {
						filepath: context.filePath,
					}),
				onDone: {
					target: CreateFileState.HIGHLIGHTING_CODE,
					actions: [
						() => console.log('Formatted!'),
						assign({
							formattedCode: (_, event: DoneInvokeEvent<string>) => event.data,
						}),
					],
				},
				onError: {
					target: CreateFileState.HIGHLIGHTING_CODE,
					actions: [
						(_, event) => console.log('Not formatted!', event),
						assign({
							formattedCode: context => context.rawCode,
						}),
					],
				},
			},
		},
		[CreateFileState.HIGHLIGHTING_CODE]: {
			invoke: {
				src: async context => {
					loadLanguages(context.fileExtension);
					return await highlightAsync({
						code: context?.formattedCode ?? '',
						language: context.fileExtension,
					});
				},
				onDone: {
					target: CreateFileState.IDLE,
					actions: assign({
						highlightedCode: (_, event: DoneInvokeEvent<string>) => event.data,
					}),
				},
				onError: {
					target: CreateFileState.HIGHLIGHTING_UNSUPPORTED_CODE,
				},
			},
		},
		[CreateFileState.HIGHLIGHTING_UNSUPPORTED_CODE]: {
			invoke: {
				src: async context =>
					await highlightAsync({
						code: context?.formattedCode ?? '',
						language: 'ts',
					}),
				onDone: {
					target: CreateFileState.IDLE,
					actions: assign({
						highlightedCode: (_, event: DoneInvokeEvent<string>) => event.data,
					}),
				},
				onError: {
					target: CreateFileState.IDLE,
					actions: assign({
						highlightedCode: context => context.formattedCode,
					}),
				},
			},
		},
		[CreateFileState.IDLE]: {
			on: {
				[CreateFileEvent.ENTER_KEY_PRESSED]: {
					target: CreateFileState.CREATING_FILE,
				},
			},
		},
		[CreateFileState.CREATING_FILE]: {
			entry: [assign({isLoading: true, showSuccessSection: true})],
			invoke: {
				src: async context => {
					await sleep(2000);
					return await writeToFile({
						filePath: context?.filePath ?? '',
						fileContent: context?.formattedCode ?? '',
					});
				},
				onDone: {
					target: CreateFileState.CREATE_FILE_SUCCESS_IDLE,
				},
			},
			exit: [assign({isLoading: false})],
		},
		[CreateFileState.CREATE_FILE_SUCCESS_IDLE]: {
			entry: [
				assign(context => ({
					enterLabel: 'next step',
					isSuccess: true,
					successMessage: `Successfully created ${context.filePath}`,
				})),
			],
			on: {
				[CreateFileEvent.ENTER_KEY_PRESSED]: {
					actions: sendParent({type: StepsEvent.NAVIGATE_NEXT_STEP}),
				},
			},
		},
	},
});
