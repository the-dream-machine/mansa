import {createMachine} from 'xstate';
import {chromaIsInstalled} from '../scripts/chroma/chromaIsInstalled.js';
import {isEmbeddingModelInstalled} from '../utils/isEmbeddingModelInstalled.js';
import {chromaIsRunning} from '../scripts/chroma/chromaIsRunning.js';
import {chromaStart} from '../scripts/chroma/chromaStart.js';
import {isRepoIndexed} from '../scripts/isRepoIndexed.js';
import {getFishcakeConfig} from '../utils/getFishcakeConfig.js';

export enum NavigationPage {
	REGISTER_REPO = 'REGISTER_REPO',
	INSTALL_DATABASE = 'INSTALL_DATABASE',
	INSTALL_EMBEDDING_MODEL = 'INSTALL_EMBEDDING_MODEL',
	INDEX_REPO = 'INDEX_REPO',
	SELECT_OPTION = 'SELECT_OPTION',
}

export enum AppState {
	IS_REPO_REGISTERED = 'IS_REPO_REGISTERED',
	IS_DATABASE_INSTALLED = 'IS_DATABASE_INSTALLED',
	IS_DATABASE_RUNNING = 'IS_DATABASE_RUNNING',
	STARTING_DATABASE = 'STARTING_DATABASE',
	IS_EMBEDDING_MODEL_INSTALLED = 'IS_EMBEDDING_MODEL_INSTALLED',
	IS_REPO_INDEXED = 'IS_REPO_INDEXED',
}

// State machine states
export type NavigationMachineState =
	| {
			value: AppState.IS_REPO_REGISTERED;
			context: never;
	  }
	| {
			value: AppState.IS_DATABASE_INSTALLED;
			context: never;
	  }
	| {
			value: AppState.IS_DATABASE_RUNNING;
			context: never;
	  }
	| {
			value: AppState.STARTING_DATABASE;
			context: never;
	  }
	| {
			value: AppState.IS_EMBEDDING_MODEL_INSTALLED;
			context: never;
	  }
	| {
			value: AppState.IS_REPO_INDEXED;
			context: never;
	  }
	| {
			value: NavigationPage.REGISTER_REPO;
			context: never;
	  }
	| {
			value: NavigationPage.INSTALL_DATABASE;
			context: never;
	  }
	| {
			value: NavigationPage.INSTALL_EMBEDDING_MODEL;
			context: never;
	  }
	| {
			value: NavigationPage.INDEX_REPO;
			context: never;
	  }
	| {
			value: NavigationPage.SELECT_OPTION;
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
	initial: AppState.IS_REPO_REGISTERED,
	states: {
		[AppState.IS_REPO_REGISTERED]: {
			invoke: {
				src: async () => await getFishcakeConfig(),
				onDone: {
					target: AppState.IS_REPO_INDEXED,
				},
				onError: {
					target: NavigationPage.REGISTER_REPO,
				},
			},
		},
		[AppState.IS_REPO_INDEXED]: {
			invoke: {
				src: async () => await isRepoIndexed(),
				onDone: {
					target: NavigationPage.SELECT_OPTION,
				},
				onError: {
					target: NavigationPage.INDEX_REPO,
				},
			},
		},
		[AppState.IS_DATABASE_INSTALLED]: {
			invoke: {
				src: async () => await chromaIsInstalled(),
				onDone: {
					target: AppState.IS_DATABASE_RUNNING,
				},
				onError: {
					target: NavigationPage.INSTALL_DATABASE,
				},
			},
		},
		[AppState.IS_DATABASE_RUNNING]: {
			invoke: {
				src: async () => await chromaIsRunning(),
				onDone: {
					target: AppState.IS_EMBEDDING_MODEL_INSTALLED,
				},
				onError: {
					target: AppState.STARTING_DATABASE,
				},
			},
		},
		[AppState.STARTING_DATABASE]: {
			invoke: {
				src: async () => await chromaStart(),
				onDone: {
					target: AppState.IS_EMBEDDING_MODEL_INSTALLED,
				},
			},
		},
		[AppState.IS_EMBEDDING_MODEL_INSTALLED]: {
			invoke: {
				src: async () => await isEmbeddingModelInstalled(),
				onDone: {
					target: AppState.IS_REPO_INDEXED,
				},
				onError: {
					target: NavigationPage.INSTALL_EMBEDDING_MODEL,
				},
			},
		},
		[NavigationPage.REGISTER_REPO]: {},
		[NavigationPage.INSTALL_DATABASE]: {},
		[NavigationPage.INSTALL_EMBEDDING_MODEL]: {},
		[NavigationPage.INDEX_REPO]: {},
		[NavigationPage.SELECT_OPTION]: {},
	},
	on: {
		[AppState.IS_REPO_REGISTERED]: {
			target: AppState.IS_REPO_REGISTERED,
		},
		[AppState.IS_DATABASE_INSTALLED]: {
			target: AppState.IS_DATABASE_INSTALLED,
		},
		[AppState.IS_DATABASE_RUNNING]: {
			target: AppState.IS_DATABASE_RUNNING,
		},
		[AppState.IS_EMBEDDING_MODEL_INSTALLED]: {
			target: AppState.IS_EMBEDDING_MODEL_INSTALLED,
		},
		[AppState.IS_REPO_INDEXED]: {
			target: AppState.IS_REPO_INDEXED,
		},
		[NavigationPage.INSTALL_DATABASE]: {
			target: NavigationPage.INSTALL_DATABASE,
		},
		[NavigationPage.REGISTER_REPO]: {
			target: NavigationPage.REGISTER_REPO,
		},
		[NavigationPage.INSTALL_EMBEDDING_MODEL]: {
			target: NavigationPage.INSTALL_EMBEDDING_MODEL,
		},
		[NavigationPage.INDEX_REPO]: {
			target: NavigationPage.INDEX_REPO,
		},
		[NavigationPage.SELECT_OPTION]: {
			target: NavigationPage.SELECT_OPTION,
		},
	},
});
