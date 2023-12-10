import {type Sender, createMachine, assign, type DoneInvokeEvent} from 'xstate';

import {AppState, type NavigationMachineEvent} from './navigationMachine.js';
import {createManjaroConfig} from '../utils/createManjaroConfig.js';
import type {PackageManager} from '../types/PackageManager.js';
import {getRepositoryDetails} from '../utils/repository/getRepositoryDetails.js';
import {type Repo} from '../types/Repo.js';

// Context
interface SelectPackageManagerMachineContext {
	repositoryName: string;
	packageManager: PackageManager;
	navigate?: Sender<NavigationMachineEvent>;
}

const initialSelectPackageManagerMachineContext: SelectPackageManagerMachineContext =
	{
		repositoryName: 'your repository',
		packageManager: 'npm',
	};

// States
export enum SelectPackageManagerState {
	FETCHING_REPOSITORY_DETAILS = 'FETCHING_REPOSITORY_DETAILS',
	IDLE = 'IDLE',
	REGISTERING_PACKAGE_MANAGER = 'REGISTERING_PACKAGE_MANAGER',
}

type SelectPackageManagerMachineState =
	| {
			value: SelectPackageManagerState.FETCHING_REPOSITORY_DETAILS;
			context: SelectPackageManagerMachineContext;
	  }
	| {
			value: SelectPackageManagerState.IDLE;
			context: SelectPackageManagerMachineContext;
	  }
	| {
			value: SelectPackageManagerState.REGISTERING_PACKAGE_MANAGER;
			context: SelectPackageManagerMachineContext;
	  };

//  Events
export enum SelectPackageManagerEvent {
	SUBMIT_SELECTION = 'SUBMIT_SELECTION',
}

type SelectPackageManagerMachineEvent = {
	type: SelectPackageManagerEvent.SUBMIT_SELECTION;
	selection: PackageManager;
};

// Machine
export const selectPackageManagerMachine = createMachine<
	SelectPackageManagerMachineContext,
	SelectPackageManagerMachineEvent,
	SelectPackageManagerMachineState
>({
	id: 'selectPackageManagerMachine',
	predictableActionArguments: true,
	initial: SelectPackageManagerState.FETCHING_REPOSITORY_DETAILS,
	context: initialSelectPackageManagerMachineContext,
	states: {
		[SelectPackageManagerState.FETCHING_REPOSITORY_DETAILS]: {
			invoke: {
				src: async () => await getRepositoryDetails(),
				onDone: {
					target: SelectPackageManagerState.IDLE,
					actions: assign({
						repositoryName: (_, event: DoneInvokeEvent<Repo>) =>
							event.data.name,
					}),
				},
			},
		},
		[SelectPackageManagerState.IDLE]: {
			on: {
				[SelectPackageManagerEvent.SUBMIT_SELECTION]: {
					target: SelectPackageManagerState.REGISTERING_PACKAGE_MANAGER,
					actions: assign({
						packageManager: (_, event) => event.selection,
					}),
				},
			},
		},
		[SelectPackageManagerState.REGISTERING_PACKAGE_MANAGER]: {
			invoke: {
				src: async context => {
					await createManjaroConfig({
						packageManager: context.packageManager,
					});
				},
				onDone: {
					actions: context => {
						if (context.navigate) {
							context.navigate(AppState.DOES_CONFIG_EXIST);
						}
					},
				},
			},
		},
	},
});
