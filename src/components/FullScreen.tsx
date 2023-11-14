import {Box, useStdout, Text} from 'ink';
import React, {useLayoutEffect, useMemo} from 'react';
import {useStdoutDimensions} from '../utils/useStdDimensions.js';

interface Props {
	children: React.ReactElement;
}

export const FullScreen = ({children}: Props) => {
	const [columns, rows] = useStdoutDimensions();
	const {stdout} = useStdout();

	useMemo(() => stdout.write('\x1b[?1049h'), [stdout]);
	useLayoutEffect(() => {
		stdout.write('\x1b[?1049h');
		return () => {
			stdout.write('\x1b[?1049l');
		};
	}, [stdout]);

	return (
		<Box
			borderStyle="single"
			borderColor="cyan"
			width={columns}
			height={rows}
			flexDirection="column"
		>
			{children}
			<Text>Fullscreen: {rows}</Text>
		</Box>
	);
};
