import {Box} from 'ink';
import React from 'react';

interface Props {
	children: React.ReactNode;
}

export const PageContainer = ({children}: Props) => {
	return (
		<Box gap={1} flexDirection="column">
			{children}
		</Box>
	);
};
