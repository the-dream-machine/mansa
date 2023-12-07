import React from 'react';
import {Box, type BoxProps} from 'ink';
import {Colors} from '../utils/Colors.js';

interface Props {
	children: React.ReactNode;
	showDivider?: boolean;
}

export const SectionContainer = ({children, showDivider = false}: Props) => {
	let sectionProps: BoxProps = {};
	if (showDivider) {
		sectionProps = {
			borderColor: Colors.DarkGray,
			borderStyle: 'round',
			borderRight: false,
			borderBottom: false,
			borderLeft: false,
		};
	}

	return (
		<Box
			flexDirection="column"
			paddingX={3}
			paddingY={3}
			gap={1}
			{...sectionProps}
		>
			{children}
		</Box>
	);
};
