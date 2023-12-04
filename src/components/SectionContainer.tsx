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

			paddingTop: 2,
		};
	}

	return (
		<Box
			flexDirection="column"
			paddingX={3}
			paddingBottom={2}
			gap={2}
			{...sectionProps}
		>
			{children}
		</Box>
	);
};
