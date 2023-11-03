import {Select, type Option} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React from 'react';
import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {queryCollection} from '../../utils/queryCollection.js';

const options: Option[] = [
	{
		label: 'Replace trpc with axios',
		value: 'Replace trpc api queries with axios',
	},
	{label: 'Add dark mode', value: 'Add dark mode to sytles'},
	// {label: 'Getting started', value: 'getting_started'},
];

interface Args {
	query: string;
	collectionName: string;
}
const submitAction = async ({query, collectionName}: Args) => {
	const queryResult = await queryCollection({query, collectionName});
	console.log('🌱 # queryResult:', queryResult);
};

export const SelectAction = () => {
	return (
		<Box flexDirection="column">
			<Header title="Install trigger.dev" />

			<Text>This is a new day</Text>
			<Select
				options={options}
				onChange={async value => {
					// console.log('🌱 # value:', value);

					await submitAction({
						query: value,
						collectionName: 'ragdoll',
					});
				}}
			/>
			<Footer controls={['esc', 'enter']} enterLabel={'Submit'} />
		</Box>
	);
};
