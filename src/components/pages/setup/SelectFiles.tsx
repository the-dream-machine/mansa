import React, {useEffect, useState} from 'react';
import {Box, Text} from 'ink';
import {type Option, TextInput, MultiSelect} from '@inkjs/ui';
import Fuse from 'fuse.js';
import {fs} from 'zx';

import {getRepoFilePaths} from '../../../scripts/getRepoFilePaths.js';
import {Header} from '../../Header.js';
import {Footer} from '../../Footer.js';
import {Body} from '../../Body.js';
import {PageContainer} from '../../PageContainer.js';
// import {saveEmbeddings} from '../../../../api/src/utils/saveEmbeddings.js';

const handleSubmit = async (filePaths: string[]) => {
	for (const filePath of filePaths) {
		console.log('🌱 # filePath:', filePath);
		const sourceCode = (await fs.readFile(filePath)).toString();
		if (sourceCode.length === 0) {
			return;
		}
		// const documents = await codeSplitter({
		// 	filePath,
		// 	sourceCode,
		// 	chunkSize: 1500,
		// });

		// console.log('📄 # Docs:', JSON.stringify(documents));
		// console.log('🌱 # Chunks LENGTH:', documents.chunks?.length);

		// await saveEmbeddings(documents);
	}
};

export const SelectFiles = () => {
	const [filePaths, setFilePaths] = useState<string[]>([]);
	const [searchQuery, setSetSearchQuery] = useState('');
	const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

	const fuse = new Fuse(filePaths, {threshold: 0.3});

	let options: Option[] = [];
	if (filePaths.length > 0) {
		if (searchQuery) {
			const results = fuse.search(searchQuery);
			options = results
				.map(result => result.item)
				.map(filePath => ({label: filePath, value: filePath}));
		} else {
			options = filePaths.map(filePath => ({label: filePath, value: filePath}));
		}
	}

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		(async () => {
			const paths = await getRepoFilePaths();
			setFilePaths(paths);
			setSelectedPaths(paths);
		})();
	}, [setSelectedPaths]);

	return (
		<PageContainer>
			<Header title="Set up fishcake" subtitle="3/3" />
			<Body>
				<Text color={'gray'} underline>
					3. Select files to index
				</Text>

				<Text color={'gray'}>
					Fishcake stores your repository in a database on your computer, then
					queries the database to generate informed suggestions. We recommend
					removing sensitive files like <Text color="white">.env</Text> and{' '}
					<Text color="white">.cert</Text> files from being indexed. You can
					also remove <Text color="white">"noisy"</Text> files like{' '}
					<Text color="white">.log,</Text> <Text color="white">.lock, </Text>
					and <Text color="white">.git</Text> files to speed up queries.
					Dependency modules, caches and build files are not indexed by default.
				</Text>

				{/* Search input */}
				<TextInput
					placeholder="Search for file/folder..."
					onChange={query => {
						setSetSearchQuery(query);
					}}
				/>

				{/* Count */}
				<Box>
					<Text color={'gray'}>
						{selectedPaths.length.toLocaleString('en-US')}/
						{filePaths.length.toLocaleString('en-US')} selected
					</Text>
					{searchQuery && (
						<Text color="gray">
							{' '}
							• {options.length} results for "{searchQuery}"
						</Text>
					)}
				</Box>

				{/* Multiselect */}
				{options.length > 0 && selectedPaths.length > 0 ? (
					<MultiSelect
						defaultValue={selectedPaths}
						visibleOptionCount={5}
						highlightText={searchQuery}
						options={options}
						onSubmit={handleSubmit}
						onChange={value => {
							setSelectedPaths(value);
						}}
					/>
				) : (
					<Text color={'red'}>No files found</Text>
				)}
			</Body>
			<Footer controls={['up', 'down', 'tab', 'search', 'esc', 'enter']} />
		</PageContainer>
	);
};
