import React, {useEffect, useState} from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import figureSet from 'figures';
import {Spinner} from '@inkjs/ui';
import {sleep} from 'zx';

import {Header} from '../../Header.js';
import {Body} from '../../Body.js';
import {Footer} from '../../Footer.js';
import {SelectFiles} from './SelectFiles.js';
import {chromaInstall} from '../../../scripts/chroma/chromaInstall.js';
import {chromaIsInstalled} from '../../../scripts/chroma/chromaIsInstalled.js';

export const InstallDatabase = () => {
	const {exit} = useApp();

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
			await sleep(1200);
			setIsInstalledLoading(false);
			setIsDatabaseInstalled(isInstalled);
		})();
	}, []);

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

	if (isDatabaseInstalled) {
		return <SelectFiles />;
	}
	if (isInstalledLoading) {
		return <Spinner label="🍥 Loading..." />;
	}

	return (
		<Box gap={1} flexDirection="column">
			<Header title="Setup fishcake" subtitle="1/3" />
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
							Hit <Text color="white">enter</Text> to go to the next step
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
		</Box>
	);
};
