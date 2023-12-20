import {createMachine} from 'xstate';
import {getRepositoryConfig} from '../utils/repository/getRepositoryConfig.js';

export enum NavigationPage {
	CREATE_CONFIG = 'CREATE_CONFIG',
	TOOLS = 'TOOLS',
}

export enum AppState {
	DOES_CONFIG_EXIST = 'DOES_CONFIG_EXIST',
}

// State machine states
export type NavigationMachineState =
	| {
			value: AppState.DOES_CONFIG_EXIST;
			context: never;
	  }
	| {
			value: NavigationPage.CREATE_CONFIG;
			context: never;
	  }
	| {
			value: NavigationPage.TOOLS;
			context: never;
	  };

//  State machine events
export type NavigationMachineEvent = {
	type: keyof typeof AppState | keyof typeof NavigationPage;
};

export const navigationMachine = createMachine<
	undefined,
	NavigationMachineEvent,
	NavigationMachineState
>({
	id: 'navigationMachine',
	predictableActionArguments: true,
	initial: AppState.DOES_CONFIG_EXIST,
	states: {
		[AppState.DOES_CONFIG_EXIST]: {
			invoke: {
				src: async () => await getRepositoryConfig(),
				onDone: {
					target: NavigationPage.TOOLS,
				},
				onError: {
					target: NavigationPage.CREATE_CONFIG,
				},
			},
		},
		[NavigationPage.CREATE_CONFIG]: {},
		[NavigationPage.TOOLS]: {},
	},
	on: {
		[AppState.DOES_CONFIG_EXIST]: {
			target: AppState.DOES_CONFIG_EXIST,
		},
		[NavigationPage.CREATE_CONFIG]: {
			target: NavigationPage.CREATE_CONFIG,
		},
		[NavigationPage.TOOLS]: {
			target: NavigationPage.TOOLS,
		},
	},
});
