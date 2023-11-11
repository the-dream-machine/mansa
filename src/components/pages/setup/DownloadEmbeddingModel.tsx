import React from 'react';
import {useMachine} from '@xstate/react';
import {Box, Text, useApp, useInput} from 'ink';
import {ProgressBar, Spinner} from '@inkjs/ui';
import figureSet from 'figures';
import {v4 as uuid} from 'uuid';

import {PageContainer} from '../../PageContainer.js';
import {Header} from '../../Header.js';
import {Body} from '../../Body.js';
import {Footer} from '../../Footer.js';
import {fishcakeUserPath} from '../../../utils/fishcakePath.js';
import {NavigationContext} from '../../NavigationProvider.js';
import {
	DownloadModelEvent,
	DownloadModelState,
	downloadModelMachine,
} from '../../../machines/downloadModelMachine.js';

const errorLogFilePath = `${fishcakeUserPath}/logs/download_model_error_${uuid()}.log`;

export const DownloadEmbeddingModel = () => {
	const [, navigate] = NavigationContext.useActor();
	const [state, send] = useMachine(downloadModelMachine, {
		context: {navigate},
	});
	const {downloadProgress, downloadSpeed} = state.context;

	const showMetadataLoader = state.matches(
		DownloadModelState.DOWNLOADING_MODEL_METADATA,
	);
	const showProgressBar =
		state.matches(DownloadModelState.DOWNLOADING_MODEL) ||
		state.matches(DownloadModelState.DOWNLOAD_SUCCESSFUL_IDLE) ||
		state.matches(DownloadModelState.DOWNLOAD_ERROR_IDLE);
	const showSuccess = state.matches(
		DownloadModelState.DOWNLOAD_SUCCESSFUL_IDLE,
	);
	const showError = state.matches(DownloadModelState.DOWNLOAD_ERROR_IDLE);
	const enterDisabled =
		state.matches(DownloadModelState.DOWNLOADING_MODEL_METADATA) ||
		state.matches(DownloadModelState.DOWNLOADING_MODEL);

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send(DownloadModelEvent.ENTER_PRESSED);
		}
	});

	const downloadSpeedUnits = ['bytes/s', 'kb/s', 'mb/s', 'gb/s', 'tb/s'][
		Math.floor(Math.log2(downloadSpeed) / 10)
	];

	return (
		<PageContainer>
			<Header title="Setup fishcake" subtitle="2/2" />
			<Body>
				<Text underline color="gray">
					2. Download embedding model
				</Text>
				<Text color="gray">
					Fishcake groups together pieces of code based on their related
					meaning. This makes it easier and faster for fishcake to find and work
					with the code it needs to modify.
				</Text>
				<Text color="gray">
					Fishcake runs the <Text color="white">bge-base-en-v1.5</Text>{' '}
					embedding model (436 MB) on your computer to perform the grouping.
					Press <Text color="white">enter</Text> to download the model.
				</Text>
				<Text color="gray">Requirements: No requirements</Text>

				{showMetadataLoader && <Spinner label="Downloading metadata..." />}

				{showProgressBar && (
					<Box gap={1}>
						<Box width={70} flexGrow={0} flexShrink={0}>
							<ProgressBar value={Math.round(downloadProgress)} />
						</Box>
						<Text>{Math.round(downloadProgress)}%</Text>
						<Text color={'gray'}>
							({Math.round(downloadSpeed).toLocaleString('en-US')}{' '}
							{downloadSpeedUnits})
						</Text>
					</Box>
				)}
				{showSuccess && (
					<>
						<Text>
							<Text color="green">{figureSet.tick} </Text>
							Download complete! 🎉
						</Text>
						<Text color="gray">
							Press <Text color="white">enter</Text> to continue.
						</Text>
					</>
				)}
				{showError && (
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
				enterLabel={showSuccess ? 'continue' : 'download'}
				enterDisabled={enterDisabled}
			/>
		</PageContainer>
	);
};
