import {Box} from 'ink';
import React from 'react';

interface Props {
	children: React.ReactNode;
}

export const PageContainer = ({children}: Props) => (
	<Box flexDirection="column" width="100%">
		{children}
	</Box>
);
