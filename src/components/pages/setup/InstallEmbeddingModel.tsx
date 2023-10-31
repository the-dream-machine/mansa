import {Box, Text, useApp, useInput} from 'ink';
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {fs, path} from 'zx';
import {ProgressBar} from '@inkjs/ui';
import figureSet from 'figures';
import {v4 as uuid} from 'uuid';

import {PageContainer} from '../../PageContainer.js';
import {Header} from '../../Header.js';
import {Body} from '../../Body.js';
import {Footer} from '../../Footer.js';
import {fishcakePath} from '../../../utils/userPath.js';
import {SelectFiles} from './SelectFiles.js';

const errorLogFilePath = `${fishcakePath}/logs/install_model_error_${uuid()}.log`;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const writeErrorToFile = async (error: any) => {
	// Ensure the directory exists before writing the log file
	const dirname = path.dirname(errorLogFilePath);
	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, {recursive: true});
	}
	await fs.writeFile(errorLogFilePath, String(error));
};

export const InstallEmbeddingModel = () => {
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [downloadSpeed, setDownloadSpeed] = useState(0);
	const [isCompleted, setIsCompleted] = useState(false);
	const [isError, setIsError] = useState(false);
	const [doesModelExist, setDoesModelExist] = useState(false);
	const [shouldDownloadStart, setSetShouldDownloadStart] = useState(false);

	const {exit} = useApp();
	useInput((input, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			if (!shouldDownloadStart) {
				setSetShouldDownloadStart(true);
			} else if (isCompleted) {
				setDoesModelExist(true);
			}
		}
	});

	useEffect(() => {
		const outputDirectory = `${fishcakePath}/models/`;
		const outputFilename = 'jina-embeddings-v2-base-en.onnx';

		// Check if model is already installed
		if (fs.existsSync(`${outputDirectory}/${outputFilename}`)) {
			setDoesModelExist(true);
		}

		if (shouldDownloadStart) {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			(async () => {
				// const url =
				// 	'https://huggingface.co/Xenova/jina-embeddings-v2-base-en/resolve/main/onnx/model_quantized.onnx';
				const url = 'https://link.testfile.org/30MB';
				const outputDirectory = `${fishcakePath}/models/`;

				// Ensure the output directory exists or create it
				if (!fs.existsSync(outputDirectory)) {
					fs.mkdirSync(outputDirectory, {recursive: true});
				}
				const outputFilePath = path.join(outputDirectory, outputFilename);

				const writer = fs.createWriteStream(outputFilePath);
				let downloadedLength = 0;
				const startTime = performance.now();

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const response = await axios({
					url: url,
					method: 'get',
					responseType: 'stream',
				});

				const totalLength = response.headers['content-length'];

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
				response.data.on('data', (chunk: any) => {
					downloadedLength += chunk.length;

					const endTime = performance.now();
					const elapsedSeconds = (endTime - startTime) / 1000;
					const downloadSpeed = downloadedLength / (1024 * elapsedSeconds);
					const downloadProgress = (downloadedLength / totalLength) * 100;

					setDownloadProgress(downloadProgress);
					setDownloadSpeed(downloadSpeed);
				});

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				response.data.on('error', async (error: string) => {
					await writeErrorToFile(error);
					setIsError(true);
				});

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				response.data.pipe(writer);

				writer.on('finish', () => setIsCompleted(true));
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				writer.on('error', async error => {
					await writeErrorToFile(error);
					setIsError(true);
				});
			})();
		}
	}, [shouldDownloadStart]);

	const downloadSpeedUnits = ['bytes/s', 'kb/s', 'mb/s', 'gb/s', 'tb/s'][
		Math.floor(Math.log2(downloadSpeed) / 10)
	];

	if (doesModelExist) {
		return <SelectFiles />;
	}

	return (
		<PageContainer>
			<Header title="Setup fishcake" subtitle="2/3" />
			<Body>
				<Text underline color="gray">
					2. Install embedding model
				</Text>
				<Text color="gray">
					Fishcake groups together pieces of code based on their related
					meaning. This makes it easier and faster for fishcake to find and work
					with the code it needs to modify.
				</Text>
				<Text color="gray">
					Fishcake runs the <Text color="cyan">jina-embeddings-v2</Text> model
					on your computer to perform this grouping. Press{' '}
					<Text color="white">enter</Text> to install the model.
				</Text>
				<Text color="gray">Requirements: No requirements</Text>

				{shouldDownloadStart && (
					<Box gap={1} width={70}>
						<ProgressBar value={Math.round(downloadProgress)} />
						<Text>{Math.round(downloadProgress)}%</Text>
						<Text color={'gray'}>
							({Math.round(downloadSpeed).toLocaleString('en-US')}{' '}
							{downloadSpeedUnits})
						</Text>
					</Box>
				)}

				{isCompleted && (
					<>
						<Text>
							<Text color="green">{figureSet.tick} </Text>
							Installation completed! 🎉
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
				enterLabel={isCompleted ? 'next step' : 'install'}
			/>
		</PageContainer>
	);
};
