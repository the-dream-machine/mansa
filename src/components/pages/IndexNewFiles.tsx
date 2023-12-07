import React from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {ProgressBar, Spinner} from '@inkjs/ui';
import figureSet from 'figures';
import {useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {PageContainer} from '../PageContainer.js';
import {NavigationContext} from '../NavigationProvider.js';
import {Colors} from '../../utils/Colors.js';
import {
	IndexNewFilesEvent,
	IndexNewFilesState,
	indexNewFilesMachine,
} from '../../machines/indexNewFilesMachine.js';
import {SectionContainer} from '../SectionContainer.js';

export const IndexNewFiles = () => {
	const [, navigate] = NavigationContext.useActor();
	const [state, send] = useMachine(indexNewFilesMachine, {
		context: {navigate},
	});

	const enterLabel = state.context.enterLabel;
	const showProgressBar = state.context.showProgressBar;
	const isLoading = state.context.isLoading;
	const isSuccess = state.context.isSuccess;
	const isError = state.context.isError;
	const errorMessage = state.context.errorMessage;

	const currentIndexingFile = state.context.currentFileIndexing;
	const currentIndexingFilePath = state.context.filePaths[currentIndexingFile];
	const currentIndexingFileCount = currentIndexingFile + 1;
	const totalFiles = state.context.filePaths.length;
	const percentageProgress = Math.round(
		(currentIndexingFileCount / totalFiles) * 100,
	);

	const enterDisabled = state.matches(IndexNewFilesState.INDEXING_NEW_FILES);

	const getStateColor = (color: Colors) =>
		showProgressBar ? Colors.DarkGray : color;

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
			<Header title="Fishcake" titleBackgroundColor={Colors.LightPink} />
			<SectionContainer>
				{/* Title */}
				<Box paddingBottom={1}>
					<Text color={Colors.White}>Sync files</Text>
				</Box>

				{/* Body */}
				<Text color={getStateColor(Colors.LightGray)}>
					Found <Text color={getStateColor(Colors.White)}>{totalFiles}</Text>{' '}
					files that have changed since last sync.
				</Text>

				<Text color={getStateColor(Colors.LightGray)}>
					Press <Text color={getStateColor(Colors.LightGreen)}>enter</Text> to
					start indexing.
				</Text>
			</SectionContainer>

			{showProgressBar && (
				<SectionContainer showDivider>
					<Box flexDirection="column" gap={1} marginBottom={1}>
						{isLoading && (
							<Box gap={1}>
								<Spinner />
								<Text color={Colors.LightGray}>
									Indexing:{' '}
									<Text color={Colors.White} italic>
										{currentIndexingFilePath}
									</Text>
								</Text>
							</Box>
						)}
						{isSuccess && (
							<Box gap={1}>
								<Text color={Colors.LightGreen}>•</Text>
								<Text color={Colors.LightGray}>Indexing complete! 🎉</Text>
							</Box>
						)}
						{isError && (
							<Box gap={1}>
								<Text color={Colors.LightRed}>•</Text>
								<Text color={Colors.LightGray}>
									Something went wrong: {errorMessage}
								</Text>
							</Box>
						)}

						{/* Progress bar */}
						<Box gap={1}>
							<Box width={70} flexGrow={0} flexShrink={0}>
								<ProgressBar value={percentageProgress} />
							</Box>
							<Text color={Colors.White}>
								{percentageProgress}%{' '}
								<Text color={Colors.LightGray}>
									({currentIndexingFileCount}/{totalFiles} files)
								</Text>
							</Text>
						</Box>
					</Box>

					{isSuccess && (
						<Text color={Colors.LightGray}>
							Press <Text color={Colors.LightGreen}>enter</Text> to continue.
						</Text>
					)}
					{isError && (
						<Text color={Colors.LightGray}>
							Press <Text color={Colors.LightGreen}>enter</Text> to retry.
						</Text>
					)}
				</SectionContainer>
			)}

			<Spacer />
			<Footer
				controls={['up', 'down', 'esc', 'enter']}
				enterLabel={enterLabel}
				enterDisabled={enterDisabled}
			/>
		</PageContainer>
	);
};
