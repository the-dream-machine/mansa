import React, {useEffect} from 'react';
import {Text, useApp, useInput} from 'ink';
import figureSet from 'figures';
import {Spinner} from '@inkjs/ui';
import {useMachine} from '@xstate/react';

import {Header} from '../../Header.js';
import {Body} from '../../Body.js';
import {Footer} from '../../Footer.js';
import {PageContainer} from '../../PageContainer.js';
import {
	InstallDatabaseEvent,
	InstallDatabaseState,
	installDatabaseMachine,
} from '../../../machines/installDatabaseMachine.js';
import {AppState} from '../../../machines/navigationMachine.js';
import {NavigationContext} from '../../NavigationProvider.js';

export const InstallDatabase = () => {
	const [, navigate] = NavigationContext.useActor();
	const [state, send] = useMachine(installDatabaseMachine);
	const {exit} = useApp();

	useInput((input, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send(InstallDatabaseEvent.ENTER_PRESSED);
		}
	});

	useEffect(() => {
		if (state.matches(InstallDatabaseState.EXIT)) {
			navigate(AppState.IS_DATABASE_INSTALLED);
		}
	}, [state]);

	const errorLogFilePath = state.context.errorLogFilePath;

	const showInstallingLoader = state.matches(
		InstallDatabaseState.INSTALLING_DATABASE,
	);
	const showInstallSuccess = state.matches(
		InstallDatabaseState.INSTALL_DATABASE_SUCCESS_IDLE,
	);
	const showInstallError = state.matches(
		InstallDatabaseState.INSTALL_DATABASE_ERROR_IDLE,
	);
	const enterDisabled = state.matches(InstallDatabaseState.INSTALLING_DATABASE);

	let enterLabel = 'install';
	if (state.matches(InstallDatabaseState.INSTALL_DATABASE_SUCCESS_IDLE)) {
		enterLabel = 'next step';
	}
	if (state.matches(InstallDatabaseState.INSTALL_DATABASE_ERROR_IDLE)) {
		enterLabel = 'retry';
	}

	return (
		<PageContainer>
			<Header title="Setup fishcake" subtitle="1/2" />
			<Body>
				<Text color={'gray'} underline>
					1. Install Database
				</Text>
				<Text color={'gray'}>
					Fishcake parses your code and splits it into small chunks that make
					sense individually. Then, it stores these chunks in a database on your
					computer. In this step, fishcake will setup the database. Press{' '}
					<Text color="white">enter</Text> to start installing.
				</Text>
				<Text color="gray">
					Requirements: Make sure you have <Text color="white">python</Text> or
					<Text color="white"> python3 </Text>
					installed.
				</Text>

				{showInstallingLoader && <Spinner label="Installing database..." />}
				{showInstallSuccess && (
					<>
						<Text>
							<Text color="green">{figureSet.tick} </Text>
							Successfully installed! 🎉
						</Text>
						<Text color="gray">
							Press <Text color="white">enter</Text> to go to the next step
						</Text>
					</>
				)}
				{showInstallError && (
					<>
						<Text>
							<Text color="red">{figureSet.cross} </Text>
							An Error occurred! 😭
						</Text>
						<Text color="gray">
							You can view the full error logs here:{' '}
							<Text color="white">{errorLogFilePath}</Text>
						</Text>
						<Text color="gray">
							Press <Text color="white">enter</Text> to retry.
						</Text>
					</>
				)}
			</Body>
			<Footer
				controls={['esc', 'enter']}
				enterLabel={enterLabel}
				enterDisabled={enterDisabled}
			/>
		</PageContainer>
	);
};
