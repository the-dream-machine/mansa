import {createMachine} from 'xstate';
import {getRepositoryConfig} from '../utils/repository/getRepositoryConfig.js';
import {getRepositoryMap} from '../utils/repository/getRepositoryMap.js';
import {getRepositoryChecksums} from '../utils/repository/getRepositoryChecksums.js';
import {repositoryChecksumsMatch} from '../utils/repository/repositoryChecksumsMatch.js';

export enum NavigationPage {
	ABOUT = 'ABOUT',
	CREATE_CONFIG = 'CREATE_CONFIG',
	INDEX_REPOSITORY = 'INDEX_REPOSITORY',
	INDEX_NEW_FILES = 'INDEX_NEW_FILES',
	STEPS = 'STEPS',
}

export enum AppState {
	DOES_CONFIG_EXIST = 'DOES_CONFIG_EXIST',
	DO_CHECKSUMS_EXIST = 'DO_CHECKSUMS_EXIST',
	DO_CHECKSUMS_MATCH = 'DO_CHECKSUMS_MATCH',
	DOES_MAP_EXIST = 'DOES_MAP_EXIST',
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
			value: AppState.DO_CHECKSUMS_EXIST;
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
	/** @xstate-layout N4IgpgJg5mDOIC5QDsCGA3AllVAXTA9sgLKoDGAFpsmAMQCSAcgMoAqAggDKcD6AIuw4AhdswCiAbQAMAXUSgADgViZ8ReSAAeiACwAmADQgAnogCMAZjMA6MzoAcOnVPsBWM69d6A7PYC+fkZoWDhqJORUNAwsHNw8YsRCYnx8TADiPMQA8nxinNJySCBKKmEa2gj6RqaVAGze1hbetVIAnFI6Hva1ra61AUEY2HiE4ZTUdEy5ABo8AEpiAApZBRolqqPluoYmiK7erY3eei06PVJ6ZrWuAyDBw2Gk41HinGIAwqw8WYus9FmMVZFdZlIoVKq7BD2GwWPR6VpXewHCwWeyo273UKjJ6RMDWejMfiCdgicQ8JhsLhvPi0CBEPHUdAEADWeMxIyIOIm+MJAmEojE5JiVOSCEZBDIHOQBSBimUG3UYMQVns1k6Pnqrg6Tg61WVJ2sl2O+jM9hcnW83gxQyxnIi3IJRP5ZIpsWptDAACdPQRPdYFAAbPAAM19AFtrOzHvaaDynSSBULKdxReLJWEZbI1vLQaAKiq1WYNd4tU5nDo9Qg9O5rH0ixc0c1XK1etaQlKubHHQkkil0pkcnkk27krT6dZxazIzaOzG8d3EslUowMtlcrxXSK+GLkEz06NM4U5aVNkqEL5DtqTvYEfZuhXIfCLNZakW3K5YVIP5d+oE7jPo2eedCR7Jd+zXIdNxTGkvR9P1AxDcNp3bQDcTjUC+xXAd12HLcdz3KVD2zE9FTzRAL2sK9ahvU170rCxnDVJopBLVwdFaHpYRuP8o2xOc4wWZYhRmUc6VjSc2QAvigIEpYsmEsRplTXcJUI2RZWKHNTzIhB61qWtvCkFEDhLRwzErE4bCkc1qLOC44W4wYUOktDHUE+SpkU0dYN9f0g1wUNPQjXi7Rkty5IUpTtzTNSZA0kFtK0cw9CkfT9iMppWlMzp6JY6w0Wvbob1RCxah0AIeIICA4A0EKxlxYiFWQLYEAAWlqStWtcawW16vq+rKxz-2c0LXN5YlSUFKDqUa3MkvPfSHD6eoEROWodhqPQkUNdiWyfT8eiGurO2A+JF0w1dBw3YVoNmxLwRLSi3FaOzmzvaFcpsM5WjcS53pWo6pNGh1CXcyLkju0j5p+w4zB+0rUXqMqHAs6j8uuM5v3fNFyp4oH6odG7eD5BNxEh5qzx0R6XGbV6frvczH30HqzT0BiqZvNxal-JyHhcwnk14DDl0u9dyZa1oUTVS1730JpmlaSs7MNXp7DZtxYTVrK2z54Gu0YGZ5jk8Wz0sVxVXsq5TWbbwLF1SF9j0FW2dRItmnhK08ZGgnY1eD4vh+P4ARNnSzYtuEree237c2rw1R8TxrMstoPAqvwgA */
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
					target: AppState.DO_CHECKSUMS_EXIST,
				},
				onError: {
					target: NavigationPage.INDEX_REPOSITORY,
				},
			},
		},
		[AppState.DO_CHECKSUMS_EXIST]: {
			invoke: {
				src: async () => await getRepositoryChecksums(),
				onDone: {
					target: AppState.DO_CHECKSUMS_MATCH,
				},
				onError: {
					target: NavigationPage.INDEX_REPOSITORY,
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
		[AppState.DO_CHECKSUMS_EXIST]: {
			target: AppState.DO_CHECKSUMS_EXIST,
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
