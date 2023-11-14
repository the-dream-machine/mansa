import {Box, measureElement, useInput, Text, useStdout} from 'ink';
import React, {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {useStdoutDimensions} from '../utils/useStdDimensions.js';

interface Props {
	children: React.ReactElement;
}

export const ScrollContainer = ({children}: Props) => {
	const [innerHeight, setInnerHeight] = useState(0);
	const [scrollTop, setScrollTop] = useState(0);
	const [columns, rows] = useStdoutDimensions();

	const containerRef = useRef();

	const {stdout} = useStdout();

	useMemo(() => stdout.write('\x1b[?1049h'), [stdout]);
	useLayoutEffect(() => {
		stdout.write('\x1b[?1049h');
		return () => {
			stdout.write('\x1b[?1049l');
		};
	}, [stdout]);
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const innerDimensions = measureElement(containerRef.current);
		setInnerHeight(innerDimensions.height);
	}, []);

	useInput((_input, key) => {
		if (key.upArrow) {
			setScrollTop(Math.max(0, scrollTop - 1));
		}
		if (key.downArrow) {
			setScrollTop(Math.min(innerHeight, scrollTop + 1));
		}
	});

	return (
		<Box
			width={'80%'}
			height={20}
			// height={rows}
			borderStyle={'single'}
			flexShrink={0}
			flexGrow={0}
			flexDirection="column"
			marginTop={-scrollTop}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			//@ts-ignore
			ref={containerRef}
		>
			{children}
			<Text>Scroll container: {innerHeight}</Text>
		</Box>
	);
};
