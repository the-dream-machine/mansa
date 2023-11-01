import React, {useEffect, useState} from 'react';
import {Text, useApp, useInput} from 'ink';
import {fs} from 'zx';

import {getRepoFilePaths} from '../../scripts/getRepoFilePaths.js';
import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {Body} from '../Body.js';
import {PageContainer} from '../PageContainer.js';
import {getRepoDetails} from '../../scripts/getRepoDetails.js';
import {codeSplitter} from '../../utils/splitter/codeSplitter/codeSplitter.js';
import {saveEmbeddings} from '../../utils/saveEmbeddings.js';

import {v4 as uuid} from 'uuid';
import type {CodeDocument} from '../../types/CodeDocument.js';
import {Spinner} from '@inkjs/ui';
import figureSet from 'figures';

const parseCode = async (filePaths: string[]): Promise<CodeDocument[]> => {
	let codeDocuments: CodeDocument[] = [];
	const gitHash = uuid();

	for (const filePath of filePaths) {
		const sourceCode = (await fs.readFile(filePath)).toString();

		try {
			const splitCode = await codeSplitter({
				gitHash,
				filePath,
				sourceCode,
				chunkSize: 1500,
			});

			codeDocuments = [...codeDocuments, splitCode];
		} catch (error) {
			console.error(error);
		}
	}

	return codeDocuments;
};

const handleSubmit = async (filePaths: string[]) => {
	const collectionName = `my_${uuid()}_repo`;
	const codeDocuments = await parseCode(filePaths);

	return await saveEmbeddings({
		codeDocuments,
		collectionName,
	});
};

export const IndexFiles = () => {
	const {exit} = useApp();
	const [repoName, setRepoName] = useState('');
	const [isIndexing, setIsIndexing] = useState(false);
	const [isIndexingSuccess, setIsIndexingSuccess] = useState(false);
	const [isIndexingError, setIsIndexingError] = useState(false);

	useInput((input, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			setIsIndexing(true);
		}
	});

	useEffect(() => {
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
				const paths = await getRepoFilePaths();
				const submitResult = await handleSubmit(paths);
				setIsIndexing(false);

				if (submitResult) {
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

				{isIndexing && <Spinner label="Indexing" />}

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
			<Footer controls={['esc', 'enter']} enterLabel={'start indexing'} />
		</PageContainer>
	);
};
