import {Box} from 'ink';
import React from 'react';

interface Props {
	children: React.ReactNode;
}

export const PageContainer = ({children}: Props) => (
	<Box flexDirection="column" gap={1}>
		{children}
	</Box>
);
