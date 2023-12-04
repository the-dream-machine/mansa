import React from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {ProgressBar, Spinner} from '@inkjs/ui';
import figureSet from 'figures';
import {useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {Body} from '../Body.js';
import {PageContainer} from '../PageContainer.js';
import {NavigationContext} from '../NavigationProvider.js';
import {BaseColors, Colors} from '../../utils/Colors.js';
import {
	IndexNewFilesEvent,
	IndexNewFilesState,
	indexNewFilesMachine,
} from '../../machines/indexNewFilesMachine.js';

export const IndexNewFiles = () => {
	const [, navigate] = NavigationContext.useActor();
	const [state, send] = useMachine(indexNewFilesMachine, {
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

	const showLoader = state.matches(IndexNewFilesState.INDEXING_NEW_FILES);
	const showProgressBar =
		state.matches(IndexNewFilesState.INDEXING_NEW_FILES) ||
		state.matches(IndexNewFilesState.INDEXING_SUCCESS_IDLE) ||
		state.matches(IndexNewFilesState.INDEXING_ERROR_IDLE);
	const showSuccessMessage = state.matches(
		IndexNewFilesState.INDEXING_SUCCESS_IDLE,
	);
	const showErrorMessage = state.matches(
		IndexNewFilesState.INDEXING_ERROR_IDLE,
	);
	const showCurrentIndexingFile = state.matches(
		IndexNewFilesState.INDEXING_NEW_FILES,
	);
	const enterDisabled = state.matches(IndexNewFilesState.INDEXING_NEW_FILES);

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send(IndexNewFilesEvent.ENTER_KEY_PRESSED);
		}
	});

	return (
		<PageContainer>
			<Header
				title="Fishcake"
				titleBackgroundColor={BaseColors.Pink600}
				isLoading={showLoader}
			/>
			<Body>
				<Text color={Colors.LightGray}>
					Found {totalFiles} files that have changed since last sync.
				</Text>

				{(!showSuccessMessage || !showErrorMessage) && (
					<Text color={Colors.LightGray}>
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
							<Box gap={1}>
								<Spinner />
								<Text color="gray">Indexing: {currentIndexingFilePath}</Text>
							</Box>
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
