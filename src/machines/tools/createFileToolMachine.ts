import {createMachine, assign, type DoneInvokeEvent} from 'xstate';

import * as prettier from 'prettier';
import {highlightAsync} from '../../utils/highlightAsync.js';
import loadLanguages from 'prismjs/components/index.js';
import {writeToFile} from '../../utils/writeToFile.js';
import {sendParent} from 'xstate/lib/actions.js';
import {sleep} from 'zx';

import {ToolEvent} from '../../types/ToolMachine.js';

// Context
export interface CreateFileToolMachineContext {
	filePath: string;
	fileExtension: string;
	fileContent: string;

	formattedFileContent?: string;
	highlightedFileContent?: string;

	enterLabel: string;
	isLoading: boolean;
	isSuccess: boolean;
	isSubmitted: boolean;
	isError: boolean;
	showSuccessSection: boolean;
}

export const initialCreateFileToolMachineContext: CreateFileToolMachineContext =
	{
		filePath: '',
		fileExtension: '',
		fileContent: '',

		formattedFileContent: '',
		highlightedFileContent: '',

		enterLabel: 'create file',
		isLoading: false,
		isSuccess: false,
		isSubmitted: false,
		isError: false,
		showSuccessSection: false,
	};

// States
export enum CreateFileToolState {
	FORMATTING_FILE_CONTENT = 'FORMATTING_FILE_CONTENT',
	HIGHLIGHTING_FILE_CONTENT = 'HIGHLIGHTING_FILE_CONTENT',
	HIGHLIGHTING_UNSUPPORTED_CODE = 'HIGHLIGHTING_UNSUPPORTED_CODE',

	IDLE = 'IDLE',
	CREATING_FILE = 'CREATING_FILE',
	SUCCESS_IDLE = 'SUCCESS_IDLE',
	ERROR_IDLE = 'ERROR_IDLE',
	FINAL = 'FINAL',
}

//  State machine states
export type CreateFileToolMachineState =
	| {
			value: CreateFileToolState.FORMATTING_FILE_CONTENT;
			context: CreateFileToolMachineContext;
	  }
	| {
			value: CreateFileToolState.HIGHLIGHTING_FILE_CONTENT;
			context: CreateFileToolMachineContext;
	  }
	| {
			value: CreateFileToolState.HIGHLIGHTING_UNSUPPORTED_CODE;
			context: CreateFileToolMachineContext;
	  }
	| {value: CreateFileToolState.IDLE; context: CreateFileToolMachineContext}
	| {
			value: CreateFileToolState.CREATING_FILE;
			context: CreateFileToolMachineContext;
	  }
	| {
			value: CreateFileToolState.SUCCESS_IDLE;
			context: CreateFileToolMachineContext;
	  }
	| {
			value: CreateFileToolState.ERROR_IDLE;
			context: CreateFileToolMachineContext;
	  }
	| {
			value: CreateFileToolState.FINAL;
			context: CreateFileToolMachineContext;
	  };

// Event
export enum CreateFileToolEvent {
	ENTER_KEY_PRESS = 'ENTER_KEY_PRESS',
}

export type CreateFileToolMachineEvent = {
	type: CreateFileToolEvent.ENTER_KEY_PRESS;
};

export const createFileToolMachine = createMachine<
	CreateFileToolMachineContext,
	CreateFileToolMachineEvent,
	CreateFileToolMachineState
>({
	/** @xstate-layout N4IgpgJg5mDOIC5QGMBOYCGAXMAxAlgDZgCyGyAFvgHZgB0uA8gEokCCAKhwJIByA4gH0AwowAiAUQDEEAPa06NAG6yA1vTSYcBYmUo16TVpx4CR4iQmWzk2fPIDaABgC6zl4lAAHWbHxZ7ak8QAA9EACYAFki6cPCANgBWeKd4gEYATkiAdkSADniAGhAAT0Q0vOy6NNTExPCMhIrIp0iAXzbizWw8IlJyKgUjdi4+IVFJKTBUVFlUOi9CbAAzOYBbOm7tPr1BwxYR03GLK2oVWwDHV3dgnz9LoKRQiOjYhOTUzJz8otLELLo2ScGQAzI08hknHUwWkOl10D0dP19AoABLcfiogAyGNRR3MkzkCms6k2CO2ugGBjo6MxOMx+ImlmsF0C7huTzu-kCwTCCBSILoiScMPiuXiGTS8XCxTKCBBaUSdEiFXikTyILyKpBIOycJAW16lJR9Fp2NxjIsUxmcwWSywq1QG0NSN21LN9LxYwJzLONjsVzcrluvm58l5iAFQpFkrFyVjMr+CDSFToIIacQyavS4TSkRB+pdOypaNxnvxAFVeABlCsABTrLA4EjEPpk8noJI05KNyL2NLLFu9VdrDabLZ9p3OAeo7ODnNDDwjyacGuqkXyufiEIKGVl5Wyguy4ScqQ18XiCoKBc6Bp7rpLpsHDOHNfrjeYzdbTOts3mixWdYyS0Xs3VLOkhzMEd33Hb8ThZGc5w8Bd7h5J4+RqNc803KUdwlfcEDyNI00zVcdTPPJEkLe9ixNOhuDELFpGEZgJE4CRBFwbgmI5bxFzQ0AMIVcI6AyYVEjSKJsnSeo9yTTIlVPRJIQyXInFzcJEnaW8i2NfsWLY-EuKY9tiT9UldL7akDM4b1jN9acHiQkNUPDdDyjVJxYjqXNgTEuo1QIioRPCApjxBS81WySjtPhECHzomyjO46Rpj-O1AKdYDEVo-TWNssx7Knf0nOuec+Ncx5BI8lpvPqGoMn85JIgIqIvOyaSItU3JwhBYUb1vahZAgOBgkssCwBcsMqueBAAFpfjlOalUa1a1vWm84pyvTqWGExvSZKal3chBIkTOUaniUTt3CaSUjOk9NrveLcvdZ8vTMQ6UOm5cwS84EIRSUENzyVIgqcKpQalPzdWhbdqJenbwPNF8oLfMdPwnL6Kp+k7snVa70hVE9QvVRICNBIUiMozTpUu2EdJopH6AYpijoE2bJISWINUoiSOrSaK8iCsTqkPPJNIVb4tKoxnEashQkrslL2bc6rkxyESUzPaL02yLMguyYjcklGNbtNoiEe2hX6CSjj7MEWthGECRq2rQRWYkVWZow-XBV6iUxR6lJFvKUHRMSMEBelbcUytikbboO3OJSwQJGYZgWA9xive+471cFymA6zDr6hD1qwWVfNpXIvNdT1Do2iAA */
	id: 'createFileToolMachine',
	predictableActionArguments: true,
	initial: CreateFileToolState.HIGHLIGHTING_FILE_CONTENT,
	context: initialCreateFileToolMachineContext,
	states: {
		[CreateFileToolState.FORMATTING_FILE_CONTENT]: {
			invoke: {
				src: async context =>
					await prettier.format(context.fileContent ?? '', {
						filepath: context.filePath,
					}),
				onDone: {
					target: CreateFileToolState.HIGHLIGHTING_FILE_CONTENT,
					actions: [
						assign({
							formattedFileContent: (_, event: DoneInvokeEvent<string>) =>
								event.data,
						}),
					],
				},
				onError: {
					target: CreateFileToolState.HIGHLIGHTING_FILE_CONTENT,
					actions: [
						assign({
							formattedFileContent: context => context.fileContent,
						}),
					],
				},
			},
		},
		[CreateFileToolState.HIGHLIGHTING_FILE_CONTENT]: {
			invoke: {
				src: async context => {
					loadLanguages(context.fileExtension);
					return await highlightAsync({
						code: context?.fileContent ?? '',
						language: context.fileExtension,
					});
				},
				onDone: {
					target: CreateFileToolState.IDLE,
					actions: [
						assign({
							highlightedFileContent: (_, event: DoneInvokeEvent<string>) =>
								event.data,
						}),
					],
				},
				onError: {
					target: CreateFileToolState.HIGHLIGHTING_UNSUPPORTED_CODE,
				},
			},
		},
		[CreateFileToolState.HIGHLIGHTING_UNSUPPORTED_CODE]: {
			invoke: {
				src: async context =>
					await highlightAsync({
						code: context?.formattedFileContent ?? '',
						language: 'ts',
					}),
				onDone: {
					target: CreateFileToolState.IDLE,
					actions: assign({
						highlightedFileContent: (_, event: DoneInvokeEvent<string>) =>
							event.data,
					}),
				},
				onError: {
					target: CreateFileToolState.IDLE,
					actions: assign({
						highlightedFileContent: context => context.formattedFileContent,
					}),
				},
			},
		},

		[CreateFileToolState.IDLE]: {
			on: {
				[CreateFileToolEvent.ENTER_KEY_PRESS]: {
					target: CreateFileToolState.CREATING_FILE,
				},
			},
		},
		[CreateFileToolState.CREATING_FILE]: {
			entry: [assign({isLoading: true, showSuccessSection: true})],
			invoke: {
				src: async context => {
					await sleep(2000);
					return await writeToFile({
						filePath: context?.filePath ?? '',
						fileContent: context?.formattedFileContent ?? '',
					});
				},
				onDone: {
					target: CreateFileToolState.SUCCESS_IDLE,
				},
			},
			exit: [assign({isLoading: false})],
		},
		[CreateFileToolState.SUCCESS_IDLE]: {
			entry: [
				assign(context => ({
					enterLabel: 'next step',
					isSuccess: true,
					successMessage: `Created ${context.filePath}`,
				})),
			],
			on: {
				[CreateFileToolEvent.ENTER_KEY_PRESS]: {
					target: CreateFileToolState.FINAL,
					actions: [
						assign({isSubmitted: true}),
						sendParent({
							type: ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT,
							output: JSON.stringify({response: 'success'}),
						}),
					],
				},
			},
		},
		[CreateFileToolState.ERROR_IDLE]: {
			on: {
				[CreateFileToolEvent.ENTER_KEY_PRESS]: {
					target: CreateFileToolState.CREATING_FILE,
				},
			},
		},
		[CreateFileToolState.FINAL]: {
			type: 'final',
		},
	},
});
