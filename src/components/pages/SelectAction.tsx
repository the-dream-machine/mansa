import {TextInput} from '@inkjs/ui';
import {Box} from 'ink';
import React from 'react';
import {Header} from '../Header.js';
import {Footer} from '../Footer.js';

export const SelectAction = () => {
	return (
		<Box flexDirection="column">
			<Header title="Search " />

			<TextInput
				placeholder="Enter your query"
				onSubmit={query => {
					console.log({query});
				}}
			/>

			<Footer controls={['esc', 'enter']} enterLabel={'Submit'} />
		</Box>
	);
};
