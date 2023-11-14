import {Box} from 'ink';
import React from 'react';

interface Props {
	children: React.ReactNode;
}

export const PageContainer = ({children}: Props) => {
	return (
		<Box
			gap={1}
			paddingX={1}
			paddingY={1}
			flexDirection="column"
			width="100%"
			height="100%"
			overflow="hidden"
		>
			{children}
		</Box>
	);
};
