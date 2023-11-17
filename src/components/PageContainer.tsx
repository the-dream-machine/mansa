import {Box} from 'ink';
import React from 'react';

interface Props {
	children: React.ReactNode;
}

export const PageContainer = ({children}: Props) => (
	<Box
		paddingX={3}
		flexGrow={0}
		flexDirection="column"
		width="100%"
		height="100%"
		gap={1}
	>
		{children}
	</Box>
);
