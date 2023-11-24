import React from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {ProgressBar} from '@inkjs/ui';
import figureSet from 'figures';
import {useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {Body} from '../Body.js';
import {PageContainer} from '../PageContainer.js';
import {
	IndexRepositoryEvent,
	IndexRepositoryState,
	indexRepositoryMachine,
} from '../../machines/indexRepositoryMachine.js';
import {NavigationContext} from '../NavigationProvider.js';
import {BaseColors, Colors} from '../Colors.js';

export const IndexRepository = () => {
	const [, navigate] = NavigationContext.useActor();
	const [state, send] = useMachine(indexRepositoryMachine, {
		context: {navigate},
	});

	const enterLabel = state.context.enterLabel;
	const indexRepositoryErrorLogPath = state.context.indexRepositoryErrorLogPath;
	const currentIndexingFile = state.context.currentFileIndexing;
	const currentIndexingFilePath = state.context.filePaths[currentIndexingFile];
	const currentIndexingFileCount = currentIndexingFile + 1;
	const totalFiles = state.context.filePaths.length;
	const percentageProgress = Math.round(
		(currentIndexingFileCount / totalFiles) * 100,
	);

	const showLoader = state.matches(IndexRepositoryState.FETCHING_REPO_DETAILS);
	const showProgressBar =
		state.matches(IndexRepositoryState.INDEXING_REPO_FILES) ||
		state.matches(IndexRepositoryState.INDEXING_SUCCESS_IDLE) ||
		state.matches(IndexRepositoryState.INDEXING_ERROR_IDLE);
	const showSuccessMessage = state.matches(
		IndexRepositoryState.INDEXING_SUCCESS_IDLE,
	);
	const showErrorMessage = state.matches(
		IndexRepositoryState.INDEXING_ERROR_IDLE,
	);
	const showCurrentIndexingFile = state.matches(
		IndexRepositoryState.INDEXING_REPO_FILES,
	);
	const enterDisabled = state.matches(IndexRepositoryState.INDEXING_REPO_FILES);

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send(IndexRepositoryEvent.ENTER_PRESSED);
		}
	});

	return (
		<PageContainer>
			<Header
				title="Fishcake"
				titleBackgroundColor={BaseColors.Pink500}
				isLoading={showLoader}
			/>
			<Body>
				<Text color={Colors.White}>
					Set up fishcake <Text color={Colors.DarkGray}>(Step 2 of 2)</Text>
				</Text>
				<Text color={'gray'}>
					Fishcake uses your <Text color="white">.gitignore</Text> file to
					figure out which files and folders should be ignored when parsing and
					indexing your code. Also, fishcake ignores file formats whose content
					can't be parsed like image, video and audio files.
				</Text>
				<Text color="gray">
					👀 <Text color="white">Privacy:</Text> All your files remain on your
					device, they are never stored on fishcake's servers. Fishcake may send
					snippets of your code to the server for processing.
				</Text>

				{(!showSuccessMessage || !showErrorMessage) && (
					<Text color="gray">
						Press <Text color="white">enter</Text> to start indexing.
					</Text>
				)}

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
							Press <Text color="white">enter</Text> to retry.
						</Text>
						<Text color="gray">
							You can view the full error logs here:{' '}
							<Text color="white">{indexRepositoryErrorLogPath}</Text>
						</Text>
					</>
				)}
			</Body>
			<Spacer />
			<Footer
				controls={['esc', 'enter']}
				enterLabel={enterLabel}
				enterDisabled={enterDisabled}
			/>
		</PageContainer>
	);
};
