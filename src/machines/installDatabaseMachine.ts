import {type Sender, assign, createMachine} from 'xstate';
import {v4 as uuid} from 'uuid';

import {chromaInstall} from '../scripts/chroma/chromaInstall.js';
import {writeFile} from '../utils/writeFile.js';
import {fishcakePath} from '../utils/fishcakePath.js';
import {AppState, type NavigationMachineEvent} from './navigationMachine.js';

// Context
interface InstallDatabaseMachineContext {
	errorLogFilePath: string;
	errorMessage: string;
	enterLabel: 'install' | 'continue' | 'retry';
	navigate?: Sender<NavigationMachineEvent>;
}

// States
export enum InstallDatabaseState {
	IDLE = 'IDLE',
	INSTALLING_DATABASE = 'INSTALLING_DATABASE',
	INSTALL_DATABASE_SUCCESS_IDLE = 'INSTALL_DATABASE_SUCCESS_IDLE',
	WRITING_ERROR_FILE = 'WRITING_ERROR_FILE',
	INSTALL_DATABASE_ERROR_IDLE = 'INSTALL_DATABASE_ERROR_IDLE',
}

type InstallDatabaseMachineState =
	| {
			value: InstallDatabaseState.IDLE;
			context: InstallDatabaseMachineContext;
	  }
	| {
			value: InstallDatabaseState.INSTALLING_DATABASE;
			context: InstallDatabaseMachineContext;
	  }
	| {
			value: InstallDatabaseState.INSTALL_DATABASE_SUCCESS_IDLE;
			context: InstallDatabaseMachineContext;
	  }
	| {
			value: InstallDatabaseState.WRITING_ERROR_FILE;
			context: InstallDatabaseMachineContext;
	  }
	| {
			value: InstallDatabaseState.INSTALL_DATABASE_ERROR_IDLE;
			context: InstallDatabaseMachineContext;
	  };

//  Events
export enum InstallDatabaseEvent {
	ENTER_PRESSED = 'ENTER_PRESSED',
}

type InstallDatatbaseMachineEvent = {type: InstallDatabaseEvent.ENTER_PRESSED};

export const installDatabaseMachine = createMachine<
	InstallDatabaseMachineContext,
	InstallDatatbaseMachineEvent,
	InstallDatabaseMachineState
>({
	/** @xstate-layout N4IgpgJg5mDOIC5QDsCGA3AllVAXTA9sgLKoDGAFpsmAMQCSAcgMoAqAggDKcD6AIuw4AhdswCiAbQAMAXUSgADgViZ8ReSAAeiACwAmADQgAnogCMAZjMA6MzoAcOnVPsBWM69d6A7PYC+fkZoWDhqJORUNAwsHNw8YsRCYnx8TADiPMQA8nxinNJySCBKKmEa2gj6RqaVAGze1hbetVIAnFI6Hva1ra61AUEY2HiE4ZTUdEy5ABo8AEpiAApZBRolqqPluoYmiK7erY3eei06PVJ6ZrWuAyDBw2Gk41HinGIAwqw8WYus9FmMVZFdZlIoVKq7BD2GwWPR6VpXewHCwWeyo273UKjJ6RMDWejMfiCdgicQ8JhsLhvPi0CBEPHUdAEADWeMxIyIOIm+MJAmEojE5JiVOSCEZBDIHOQBSBimUG3UYMQVns1k6Pnqrg6Tg61WVJ2sl2O+jM9hcnW83gxQyxnIi3IJRP5ZIpsWptDAACdPQRPdYFAAbPAAM19AFtrOzHvaaDynSSBULKdxReLJWEZbI1vLQaAKiq1WYNd4tU5nDo9Qg9O5rH0ixc0c1XK1etaQlKubHHQkkil0pkcnkk27krT6dZxazIzaOzG8d3EslUowMtlcrxXSK+GLkEz06NM4U5aVNkqEL5DtqTvYEfZuhXIfCLNZakW3K5YVIP5d+oE7jPo2eedCR7Jd+zXIdNxTGkvR9P1AxDcNp3bQDcTjUC+xXAd12HLcdz3KVD2zE9FTzRAL2sK9ahvU170rCxnDVJopBLVwdFaHpYRuP8o2xOc4wWZYhRmUc6VjSc2QAvigIEpYsmEsRplTXcJUI2RZWKHNTzIhB61qWtvCkFEDhLRwzErE4bCkc1qLOC44W4wYUOktDHUE+SpkU0dYN9f0g1wUNPQjXi7Rkty5IUpTtzTNSZA0kFtK0cw9CkfT9iMppWlMzp6JY6w0Wvbob1RCxah0AIeIICA4A0EKxlxYiFWQLYEAAWlqStWtcawW16vq+rKxz-2c0LXN5YlSUFKDqUa3MkvPfSHD6eoEROWodhqPQkUNdiWyfT8eiGurO2A+JF0w1dBw3YVoNmxLwRLSi3FaOzmzvaFcpsM5WjcS53pWo6pNGh1CXcyLkju0j5p+w4zB+0rUXqMqHAs6j8uuM5v3fNFyp4oH6odG7eD5BNxEh5qzx0R6XGbV6frvczH30HqzT0BiqZvNxal-JyHhcwnk14DDl0u9dyZa1oUTVS1730JpmlaSs7MNXp7DZtxYTVrK2z54Gu0YGZ5jk8Wz0sVxVXsq5TWbbwLF1SF9j0FW2dRItmnhK08ZGgnY1eD4vh+P4ARNnSzYtuEree237c2rw1R8TxrMstoPAqvwgA */
	id: 'installDatabaseMachine',
	predictableActionArguments: true,
	initial: InstallDatabaseState.IDLE,
	context: {
		errorLogFilePath: '',
		errorMessage: '',
		enterLabel: 'install',
	},
	states: {
		[InstallDatabaseState.IDLE]: {
			on: {
				[InstallDatabaseEvent.ENTER_PRESSED]: {
					target: InstallDatabaseState.INSTALLING_DATABASE,
				},
			},
		},
		[InstallDatabaseState.INSTALLING_DATABASE]: {
			invoke: {
				src: async () => await chromaInstall(),
				onDone: {
					target: InstallDatabaseState.INSTALL_DATABASE_SUCCESS_IDLE,
					actions: assign({
						enterLabel: 'continue',
					}),
				},
				onError: {
					target: InstallDatabaseState.WRITING_ERROR_FILE,
					actions: assign({
						errorMessage: (context, event) => event.data.stderr,
						errorLogFilePath: `${fishcakePath}/logs/install_db_error_${uuid()}.log`,
					}),
				},
			},
		},
		[InstallDatabaseState.WRITING_ERROR_FILE]: {
			invoke: {
				src: async context =>
					await writeFile({
						filePath: context.errorLogFilePath,
						fileContent: context.errorMessage,
					}),
				onDone: {
					target: InstallDatabaseState.INSTALL_DATABASE_ERROR_IDLE,
					actions: assign({
						enterLabel: 'retry',
					}),
				},
			},
		},
		[InstallDatabaseState.INSTALL_DATABASE_ERROR_IDLE]: {
			on: {
				[InstallDatabaseEvent.ENTER_PRESSED]: {
					target: InstallDatabaseState.INSTALLING_DATABASE,
				},
			},
		},
		[InstallDatabaseState.INSTALL_DATABASE_SUCCESS_IDLE]: {
			on: {
				[InstallDatabaseEvent.ENTER_PRESSED]: {
					actions: context => {
						if (context.navigate) {
							context.navigate(AppState.IS_DATABASE_INSTALLED);
						}
					},
				},
			},
		},
	},
});
