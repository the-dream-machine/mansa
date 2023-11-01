import React, {useEffect, useState} from 'react';
import {Text, useApp, useInput} from 'ink';
import figureSet from 'figures';
import {Spinner} from '@inkjs/ui';
import {sleep} from 'zx';

import {Header} from '../../Header.js';
import {Body} from '../../Body.js';
import {Footer} from '../../Footer.js';
import {chromaInstall} from '../../../scripts/chroma/chromaInstall.js';
import {chromaIsInstalled} from '../../../scripts/chroma/chromaIsInstalled.js';
import {PageContainer} from '../../PageContainer.js';
import {useNavigation} from '../../NavigationProvider.js';

export const InstallDatabase = () => {
	const {exit} = useApp();
	const navigation = useNavigation();

	const [isDatabaseInstalled, setIsDatabaseInstalled] = useState(false);
	const [isInstalledLoading, setIsInstalledLoading] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [errorLogFilePath, setErrorLogFilePath] = useState('');
	const [isSuccess, setIsSuccess] = useState(false);

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		(async () => {
			const isInstalled = await chromaIsInstalled();
			await sleep(300); // Show loading spinner for at least a second so we don't have a flickering transition.
			setIsInstalledLoading(false);
			setIsDatabaseInstalled(isInstalled);
		})();

		if (isDatabaseInstalled) {
			navigation?.navigate('installEmbeddingModel');
		}
	}, [isDatabaseInstalled]);

	useInput((input, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			if (!isSuccess) {
				// eslint-disable-next-line @typescript-eslint/no-floating-promises
				(async () => {
					setIsLoading(true);
					const {status, errorLogFilePath} = await chromaInstall();
					if (status) {
						setIsSuccess(true);
					} else {
						setIsError(true);
						if (errorLogFilePath) {
							setErrorLogFilePath(errorLogFilePath);
						}
					}

					setIsLoading(false);
				})();
			} else {
				setIsDatabaseInstalled(true);
			}
		}
	});

	if (isInstalledLoading) {
		return <Spinner label="🍥 Loading..." />;
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

				{isLoading && <Spinner label="Installing database..." />}
				{isSuccess && (
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
				{isError && (
					<>
						<Text>
							<Text color="red">{figureSet.cross} </Text>
							An Error occurred! 😭
						</Text>

						<Text color="gray">
							You can view the full error logs here:{' '}
							<Text color="white">{errorLogFilePath}</Text>
						</Text>
					</>
				)}
			</Body>
			<Footer
				controls={['esc', 'enter']}
				enterLabel={isSuccess ? 'next step' : 'install'}
			/>
		</PageContainer>
	);
};
