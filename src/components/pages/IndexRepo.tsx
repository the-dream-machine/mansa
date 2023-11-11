import React from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {ProgressBar} from '@inkjs/ui';
import figureSet from 'figures';
import {useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {Body} from '../Body.js';
import {PageContainer} from '../PageContainer.js';
import {
	IndexRepoEvent,
	IndexRepoState,
	indexRepoMachine,
} from '../../machines/indexRepoMachine.js';
import {GlobalLoader} from '../GlobalLoader.js';
import {NavigationContext} from '../NavigationProvider.js';

export const IndexRepo = () => {
	const [, navigate] = NavigationContext.useActor();
	const [state, send] = useMachine(indexRepoMachine, {
		context: {navigate},
	});
	console.log('🌱 # state:', state.value);

	const repoName = state.context.repoName;
	const indexErrorLogPath = state.context.indexErrorLogPath;
	const currentIndexingFile = state.context.currentFileIndexing;
	const currentIndexingFilePath = state.context.filePaths[currentIndexingFile];
	const currentIndexingFileCount = currentIndexingFile + 1;
	const totalFiles = state.context.filePaths.length;
	const percentageProgress = Math.round(
		(currentIndexingFileCount / totalFiles) * 100,
	);

	const showLoader = state.matches(IndexRepoState.FETCHING_REPO_DETAILS);
	const showProgressBar =
		state.matches(IndexRepoState.INDEXING_REPO_FILE) ||
		state.matches(IndexRepoState.REGISTER_REPO) ||
		state.matches(IndexRepoState.INDEXING_SUCCESS_IDLE) ||
		state.matches(IndexRepoState.INDEXING_ERROR_IDLE);
	const showSuccessMessage = state.matches(
		IndexRepoState.INDEXING_SUCCESS_IDLE,
	);
	const showErrorMessage = state.matches(IndexRepoState.INDEXING_ERROR_IDLE);
	const showCurrentIndexingFile = state.matches(
		IndexRepoState.INDEXING_REPO_FILE,
	);
	const enterDisabled =
		state.matches(IndexRepoState.INDEXING_REPO_FILE) ||
		state.matches(IndexRepoState.REGISTER_REPO);

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send(IndexRepoEvent.ENTER_PRESSED);
		}
	});

	if (showLoader) {
		return <GlobalLoader />;
	}

	return (
		<PageContainer>
			<Header title={`Set up fishcake for your repo`} subtitle="2/2" />
			<Body>
				<Text color={'gray'}>
					Fishcake uses your <Text color="white">.gitignore</Text> file to
					figure out which files and folders should be ignored when parsing and
					indexing your code. Also, fishcake ignores file formats whose content
					can't be parsed like image, video and audio files.
				</Text>

				<Text color="gray">
					Press <Text color="white">enter</Text> to start indexing.
				</Text>

				{showProgressBar && (
					<Box flexDirection="column" gap={1}>
						<Box gap={1}>
							<Box width={70} flexGrow={0} flexShrink={0}>
								<ProgressBar value={percentageProgress} />
							</Box>
							<Text>
								{percentageProgress}%{' '}
								<Text color="gray">
									({currentIndexingFileCount}/{totalFiles} files)
								</Text>
							</Text>
						</Box>
						{showCurrentIndexingFile && (
							<Text color="gray">Indexing: {currentIndexingFilePath}</Text>
						)}
					</Box>
				)}

				{showSuccessMessage && (
					<>
						<Text>
							<Text color="green">{figureSet.tick} </Text>
							Indexing complete! 🎉
						</Text>
						<Text color="gray">
							Press <Text color="white">enter</Text> to continue.
						</Text>
					</>
				)}

				{showErrorMessage && (
					<>
						<Text>
							<Text color="red">{figureSet.cross} </Text>
							An Error occurred! 😭
						</Text>

						<Text color="gray">
							You can view the full error logs here:{' '}
							<Text color="white">{indexErrorLogPath}</Text>
						</Text>
					</>
				)}
			</Body>
			<Footer
				controls={['esc', 'enter']}
				enterLabel={showSuccessMessage ? 'continue' : 'start indexing'}
				enterDisabled={enterDisabled}
			/>
		</PageContainer>
	);
};
