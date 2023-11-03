import React from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {ProgressBar, Spinner} from '@inkjs/ui';
import figureSet from 'figures';
import {useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {Body} from '../Body.js';
import {PageContainer} from '../PageContainer.js';
import {State, indexFilesMachine} from '../../machines/indexFilesMachine.js';

export const IndexFiles = () => {
	const [state, send] = useMachine(indexFilesMachine);

	const repoName = state.context.repoName;
	const currentIndexingFile = state.context.currentFileIndexing;
	const currentIndexingFilePath = state.context.filePaths[currentIndexingFile];
	const currentIndexingFileCount = currentIndexingFile + 1;
	const totalFiles = state.context.filePaths.length;
	const percentageProgress = Math.round(
		(currentIndexingFileCount / totalFiles) * 100,
	);

	const {exit} = useApp();
	useInput((input, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send('ENTER_PRESSED');
		}
	});

	const showLoader =
		state.matches(State.CHECKING_STATUS) ||
		state.matches(State.STARTING_DATABASE) ||
		state.matches(State.FETCHING_REPO_DETAILS);
	const showProgressBar =
		state.matches(State.INDEXING_FILES) ||
		state.matches(State.REGISTER_REPO) ||
		state.matches(State.INDEXING_SUCCESS_IDLE) ||
		state.matches(State.INDEXING_ERROR_IDLE);
	const showSuccessMessage = state.matches(State.INDEXING_SUCCESS_IDLE);
	const showErrorMessage = state.matches(State.INDEXING_ERROR_IDLE);
	const showCurrentIndexingFile = state.matches(State.INDEXING_FILES);

	if (showLoader) {
		return <Spinner label="🍥 Loading.." />;
	}

	return (
		<PageContainer>
			<Header title={`Index ${repoName} files`} />
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
						{showCurrentIndexingFile ? (
							<Text color="gray">Indexing: {currentIndexingFilePath}</Text>
						) : (
							<Text> </Text>
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

						{/* <Text color="gray">
							You can view the full error logs here:{' '}
							<Text color="white">{errorLogFilePath}</Text>
						</Text> */}
					</>
				)}
			</Body>
			<Footer
				controls={['esc', 'enter']}
				enterLabel={showSuccessMessage ? 'continue' : 'start indexing'}
			/>
		</PageContainer>
	);
};
