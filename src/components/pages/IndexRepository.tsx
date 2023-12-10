import React from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {ProgressBar, Spinner} from '@inkjs/ui';
import {useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {PageContainer} from '../PageContainer.js';
import {
	IndexRepositoryEvent,
	IndexRepositoryState,
	indexRepositoryMachine,
} from '../../machines/indexRepositoryMachine.js';
import {NavigationContext} from '../NavigationProvider.js';
import {Colors} from '../../styles/Colors.js';
import {SectionContainer} from '../SectionContainer.js';
import {ScrollContainer} from '../ScrollContainer.js';

export const IndexRepository = () => {
	const [, navigate] = NavigationContext.useActor();
	const [state, send] = useMachine(indexRepositoryMachine, {
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

	const enterDisabled = state.matches(IndexRepositoryState.INDEXING_REPO_FILES);

	const getStateColor = (color: Colors) =>
		showProgressBar ? Colors.DarkGray : color;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send(IndexRepositoryEvent.ENTER_KEY_PRESS);
		}
	});

	return (
		<PageContainer>
			<Header title="manjaro" titleBackgroundColor={Colors.DarkYellow} />

			<ScrollContainer>
				<SectionContainer>
					<Box paddingBottom={1}>
						<Text color={Colors.White}>
							Set up manjaro <Text color={Colors.DarkGray}>(Step 2 of 2)</Text>
						</Text>
					</Box>

					<Text color={getStateColor(Colors.LightGray)}>
						To provide instructions tailored to your codebase, manjaro needs to
						analyze and create an index of your project's files. The index helps
						manjaro learn which files need to be created or edited.
					</Text>

					<Text color={getStateColor(Colors.LightGray)}>
						manjaro looks at your{' '}
						<Text color={getStateColor(Colors.White)} italic>
							.gitignore
						</Text>{' '}
						file to figure out which files and folders should be ignored when
						indexing your code. All file formats whose content can't be parsed
						like image, video and audio files are automatically ignored.
					</Text>

					<Box
						marginY={1}
						paddingX={2}
						paddingY={1}
						flexDirection="column"
						gap={1}
						borderStyle="round"
						borderColor={getStateColor(Colors.DarkGray)}
					>
						<Text color={getStateColor(Colors.White)}>👀 Privacy</Text>
						<Text color={getStateColor(Colors.LightGray)}>
							manjaro may send snippets of your code to the server for
							processing. All your files and their content remain on your
							device, they are never stored by manjaro or third parties.
						</Text>
					</Box>

					<Text color={getStateColor(Colors.LightGray)}>
						Press <Text color={getStateColor(Colors.LightGreen)}>enter</Text> to
						start indexing.
					</Text>
				</SectionContainer>

				{showProgressBar && (
					<SectionContainer showDivider>
						<Box flexDirection="column" gap={2}>
							{/* State */}
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
								<Text>
									{percentageProgress}%{' '}
									<Text color={Colors.LightGray}>
										({currentIndexingFileCount}/{totalFiles} files)
									</Text>
								</Text>
							</Box>

							{/* Press Enter */}
							{isError && (
								<Text color={Colors.LightGray}>
									Press <Text color={Colors.LightGreen}>enter</Text> to retry.
								</Text>
							)}
							{isSuccess && (
								<Text color={Colors.LightGray}>
									Press <Text color={Colors.LightGreen}>enter</Text> to
									continue.
								</Text>
							)}
						</Box>
					</SectionContainer>
				)}
			</ScrollContainer>
			<Spacer />
			<Footer
				controls={['up', 'down', 'esc', 'enter']}
				enterLabel={enterLabel}
				enterDisabled={enterDisabled}
			/>
		</PageContainer>
	);
};
