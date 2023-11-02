import React, {type Dispatch, useEffect, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';

import {getRepoFilePaths} from '../../scripts/getRepoFilePaths.js';
import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {Body} from '../Body.js';
import {PageContainer} from '../PageContainer.js';
import {getRepoDetails} from '../../scripts/getRepoDetails.js';
import {saveEmbeddings} from '../../utils/saveEmbeddings.js';

import {v4 as uuid} from 'uuid';
import {ProgressBar} from '@inkjs/ui';
import figureSet from 'figures';
import {registerRepo} from '../../scripts/registerRepo.js';
import {parseFiles} from '../../utils/parseFiles.js';
import {fs} from 'zx';
import {useNavigation} from '../NavigationProvider.js';
import type {Config} from '../../types/Config.js';

interface SubmitArgs {
	filePaths: string[];
	setProgress: Dispatch<React.SetStateAction<number>>;
}

const handleSubmit = async ({filePaths, setProgress}: SubmitArgs) => {
	const repo = await getRepoDetails();
	const collectionName = repo.name ?? uuid();
	const codeDocuments = await parseFiles(filePaths);

	return await saveEmbeddings({codeDocuments, collectionName, setProgress});
};

export const IndexFiles = () => {
	const {exit} = useApp();
	const navigation = useNavigation();

	const [repoName, setRepoName] = useState('');
	const [isIndexing, setIsIndexing] = useState(false);
	const [indexingProgress, setIndexingProgress] = useState(0);
	const [isIndexingSuccess, setIsIndexingSuccess] = useState(false);
	const [isIndexingError, setIsIndexingError] = useState(false);

	useInput((input, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			if (isIndexingSuccess) {
				navigation?.navigate('selectInstallation');
			} else {
				setIsIndexing(true);
			}
		}
	});

	useEffect(() => {
		try {
			// Check if files are already indexed
			const config: Config = fs.readJsonSync('./.fishcake/config.json');
			if (config.filePaths.length === 0) {
				throw new Error('file not found');
			}
			navigation?.navigate('selectInstallation');
		} catch (error) {}

		if (!repoName) {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			(async () => {
				const repo = await getRepoDetails();
				setRepoName(repo.name ?? 'your repo');
			})();
		}

		if (isIndexing) {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			(async () => {
				const filePaths = await getRepoFilePaths();
				const submitResult = await handleSubmit({
					filePaths,
					setProgress: setIndexingProgress,
				});
				setIsIndexing(false);

				if (submitResult) {
					await registerRepo({repo: repoName, filePaths});
					setIsIndexingSuccess(true);
				} else {
					setIsIndexingError(true);
				}
			})();
		}
	}, [isIndexing]);

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

				{(isIndexing || isIndexingSuccess || isIndexingError) && (
					<Box gap={1}>
						<Box width={70} flexGrow={0} flexShrink={0}>
							<ProgressBar value={indexingProgress} />
						</Box>
						<Text>{indexingProgress}%</Text>
					</Box>
				)}

				{isIndexingSuccess && (
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
				{isIndexingError && (
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
				enterLabel={isIndexingSuccess ? 'continue' : 'start indexing'}
			/>
		</PageContainer>
	);
};
