import React from 'react';
import {Box, Text} from 'ink';

interface Props {
	title: string;
	subtitle?: string;
}

export const Header = ({title, subtitle}: Props) => {
	return (
		<Box alignItems="flex-start" gap={0}>
			<Box borderStyle="single" paddingX={1} flexShrink={0}>
				<Text>
					🍥 {title} {subtitle && <Text color="gray">({subtitle})</Text>}
				</Text>
			</Box>
			<Box
				paddingBottom={1}
				borderStyle="single"
				borderTop={false}
				borderRight={false}
				borderLeft={false}
				width="100%"
			/>
		</Box>
	);
};
