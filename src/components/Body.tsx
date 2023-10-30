import {Box} from 'ink';
import React from 'react';

interface Props {
	children: React.ReactNode;
}

export const Body = ({children}: Props) => {
	return (
		<Box paddingX={2} flexDirection="column" gap={1}>
			{children}
		</Box>
	);
};
