import {Box, measureElement, useInput, Text} from 'ink';
import React, {useEffect, useRef, useState} from 'react';
import {useStdoutDimensions} from '../utils/useStdDimensions.js';

interface Props {
	children: React.ReactNode;
}
const FOOTER_HEIGHT = 4;

export const ScrollContainer = ({children}: Props) => {
	const [, columns] = useStdoutDimensions();
	const height = columns - FOOTER_HEIGHT;
	const [innerHeight, setInnerHeight] = useState(height);
	const [scrollTop, setScrollTop] = useState(0);
	const innerRef = useRef();

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const dimensions = measureElement(innerRef.current);
		setInnerHeight(dimensions.height);
	}, [children]);

	useInput((_input, key) => {
		if (key.downArrow) {
			if (innerHeight >= height) {
				setScrollTop(
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					Math.min(innerHeight - height + 2, scrollTop + 1),
				);
			}
		}

		if (key.upArrow) {
			setScrollTop(Math.max(0, scrollTop - 1));
		}
	});

	return (
		<Box height={height} flexDirection="column" overflow="hidden">
			<Box
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				ref={innerRef}
				flexShrink={0}
				flexDirection="column"
				marginTop={-scrollTop}
			>
				{children}
			</Box>
		</Box>
	);
};
