import {createMachine} from 'xstate';
import {getRepositoryConfig} from '../utils/repository/getRepositoryConfig.js';
import {getRepositoryMap} from '../utils/repository/getRepositoryMap.js';
import {getRepositoryChecksums} from '../utils/repository/getRepositoryChecksums.js';
import {repositoryChecksumsMatch} from '../utils/repository/repositoryChecksumsMatch.js';
import {getRepositoryFilePaths} from '../utils/repository/getRepositoryFilePaths.js';
import {writeToFile} from '../utils/writeToFile.js';
import {jojiRepositoryPath} from '../utils/jojiPath.js';

export enum NavigationPage {
	ABOUT = 'ABOUT',
	CREATE_CONFIG = 'CREATE_CONFIG',
	INDEX_REPOSITORY = 'INDEX_REPOSITORY',
	INDEX_NEW_FILES = 'INDEX_NEW_FILES',
	STEPS = 'STEPS',
}

export enum AppState {
	DOES_CONFIG_EXIST = 'DOES_CONFIG_EXIST',
	DOES_MAP_EXIST = 'DOES_MAP_EXIST',
	DO_MAP_FILE_PATHS_EXIST = 'DO_MAP_FILE_PATHS_EXIST',
	DO_CHECKSUMS_EXIST = 'DO_CHECKSUMS_EXIST',
	DO_CHECKSUM_FILE_PATHS_EXIST = 'DO_CHECKSUM_FILE_PATHS_EXIST',
	DO_CHECKSUMS_MATCH = 'DO_CHECKSUMS_MATCH',
}

// State machine states
export type NavigationMachineState =
	| {
			value: AppState.DOES_CONFIG_EXIST;
			context: never;
	  }
	| {
			value: AppState.DOES_MAP_EXIST;
			context: never;
	  }
	| {
			value: AppState.DO_MAP_FILE_PATHS_EXIST;
			context: never;
	  }
	| {
			value: AppState.DO_CHECKSUMS_EXIST;
			context: never;
	  }
	| {
			value: AppState.DO_CHECKSUM_FILE_PATHS_EXIST;
			context: never;
	  }
	| {
			value: AppState.DO_CHECKSUMS_MATCH;
			context: never;
	  }
	| {
			value: NavigationPage.ABOUT;
			context: never;
	  }
	| {
			value: NavigationPage.CREATE_CONFIG;
			context: never;
	  }
	| {
			value: NavigationPage.INDEX_REPOSITORY;
			context: never;
	  }
	| {
			value: NavigationPage.INDEX_NEW_FILES;
			context: never;
	  }
	| {
			value: NavigationPage.STEPS;
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
					target: AppState.DOES_MAP_EXIST,
				},
				onError: {
					target: NavigationPage.CREATE_CONFIG,
				},
			},
		},
		[AppState.DOES_MAP_EXIST]: {
			invoke: {
				src: async () => await getRepositoryMap(),
				onDone: {
					target: AppState.DO_MAP_FILE_PATHS_EXIST,
				},
				onError: {
					target: NavigationPage.INDEX_REPOSITORY,
				},
			},
		},
		[AppState.DO_MAP_FILE_PATHS_EXIST]: {
			invoke: {
				src: async () => {
					const repositoryMapFiles = await getRepositoryMap();
					const indexedFilePaths = repositoryMapFiles.map(
						fileMapItem => fileMapItem.filePath,
					);
					const allFilePaths = await getRepositoryFilePaths();
					const removedFilePaths = indexedFilePaths.filter(
						filePath => !allFilePaths.includes(filePath),
					);

					// Un-index files that don't exist in the repo
					if (removedFilePaths.length > 0) {
						const updatedFilePaths = repositoryMapFiles.filter(
							fileMapItem => !removedFilePaths.includes(fileMapItem.filePath),
						);

						await writeToFile({
							filePath: `${jojiRepositoryPath}/map.json`,
							fileContent: JSON.stringify(updatedFilePaths),
						});
					}
					return;
				},
				onDone: {
					target: AppState.DO_CHECKSUMS_EXIST,
				},
			},
		},
		[AppState.DO_CHECKSUMS_EXIST]: {
			invoke: {
				src: async () => await getRepositoryChecksums(),
				onDone: {
					target: AppState.DO_CHECKSUM_FILE_PATHS_EXIST,
				},
				onError: {
					target: NavigationPage.INDEX_REPOSITORY,
				},
			},
		},
		[AppState.DO_CHECKSUM_FILE_PATHS_EXIST]: {
			invoke: {
				src: async () => {
					const repositoryChecksums = await getRepositoryChecksums();
					const indexedFilePaths = repositoryChecksums.map(
						checksumItem => checksumItem.filePath,
					);
					const allFilePaths = await getRepositoryFilePaths();
					const removedFilePaths = indexedFilePaths.filter(
						filePath => !allFilePaths.includes(filePath),
					);

					if (removedFilePaths.length > 0) {
						const updatedFilePaths = repositoryChecksums.filter(
							fileChecksum => !removedFilePaths.includes(fileChecksum.filePath),
						);

						// Un-index files that don't exist in the repo
						await writeToFile({
							filePath: `${jojiRepositoryPath}/checksums.json`,
							fileContent: JSON.stringify(updatedFilePaths),
						});
					}
					return;
				},
				onDone: {
					target: AppState.DO_CHECKSUMS_MATCH,
				},
			},
		},
		[AppState.DO_CHECKSUMS_MATCH]: {
			invoke: {
				src: async () => await repositoryChecksumsMatch(),
				onDone: {
					target: NavigationPage.STEPS,
				},
				onError: {
					target: NavigationPage.INDEX_NEW_FILES,
				},
			},
		},

		[NavigationPage.ABOUT]: {},
		[NavigationPage.CREATE_CONFIG]: {},
		[NavigationPage.INDEX_REPOSITORY]: {},
		[NavigationPage.INDEX_NEW_FILES]: {},
		[NavigationPage.STEPS]: {},
	},
	on: {
		[AppState.DOES_CONFIG_EXIST]: {
			target: AppState.DOES_CONFIG_EXIST,
		},
		[AppState.DOES_MAP_EXIST]: {
			target: AppState.DOES_MAP_EXIST,
		},
		[AppState.DO_MAP_FILE_PATHS_EXIST]: {
			target: AppState.DO_MAP_FILE_PATHS_EXIST,
		},
		[AppState.DO_CHECKSUMS_EXIST]: {
			target: AppState.DO_CHECKSUMS_EXIST,
		},
		[AppState.DO_CHECKSUM_FILE_PATHS_EXIST]: {
			target: AppState.DO_CHECKSUM_FILE_PATHS_EXIST,
		},

		[AppState.DO_CHECKSUMS_MATCH]: {
			target: AppState.DO_CHECKSUMS_MATCH,
		},
		[NavigationPage.ABOUT]: {
			target: NavigationPage.ABOUT,
		},
		[NavigationPage.CREATE_CONFIG]: {
			target: NavigationPage.CREATE_CONFIG,
		},
		[NavigationPage.INDEX_REPOSITORY]: {
			target: NavigationPage.INDEX_REPOSITORY,
		},
		[NavigationPage.INDEX_NEW_FILES]: {
			target: NavigationPage.INDEX_NEW_FILES,
		},
		[NavigationPage.STEPS]: {
			target: NavigationPage.STEPS,
		},
	},
});
