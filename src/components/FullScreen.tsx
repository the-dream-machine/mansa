import {Box, useStdout} from 'ink';
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
		<Box width={columns} height={rows}>
			{children}
		</Box>
	);
};
