import {Select, type Option, TextInput} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {useState} from 'react';
import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {queryCollection} from '../../utils/queryCollection.js';
import {Metadata} from 'chromadb/dist/main/types.js';

const options: Option[] = [
	{
		label: 'Replace trpc with axios',
		value: 'Replace trpc api queries with axios',
	},
	{label: 'Add dark mode', value: 'Add dark mode to styles'},
	{
		label: 'Packages',
		value: 'npm packages',
	},
	// {label: 'Getting started', value: 'getting_started'},
];

interface Args {
	query: string[];
	collectionName: string;
}
const submitAction = async ({query, collectionName}: Args) => {
	const queryResult = await queryCollection({query});
	console.log('🌱 # queryResult:', queryResult);
};

interface Result {
	document: string | null;
	metadata: {filePath: string; relations: string};
}
[];

export const SelectAction = () => {
	const [results, setResults] = useState<Result[]>([]);
	return (
		<Box flexDirection="column">
			<Header title="Search " />

			<TextInput
				placeholder="Enter your query"
				onSubmit={async query => {
					const results = await queryCollection({
						query: [query],
					});
					console.log('🌱 # results:', JSON.stringify(results));
					if (results && results.length > 0) {
						setResults(results as Result[]);
					}
				}}
			/>
			{/* 
			<Box flexDirection="column">
				{results.map((result, index) => (
					<>
						<Text>{index}</Text>
						<Text>{result.metadata.filePath}</Text>
						<Text>{result.document}</Text>
					</>
				))}
			</Box> */}

			{/* <Select
				options={options}
				onChange={async value => {
					// console.log('🌱 # value:', value);

					await submitAction({
						query: [value],
						collectionName: 'ragdoll',
					});
				}}
			/> */}
			<Footer controls={['esc', 'enter']} enterLabel={'Submit'} />
		</Box>
	);
};
