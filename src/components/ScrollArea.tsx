import {Box, measureElement, useInput, Text} from 'ink';
import React, {useEffect, useRef, useState} from 'react';

interface Props {
	height: number;
	children: React.ReactNode;
}

export const ScrollArea = ({height, children}: Props) => {
	const [innerHeight, setInnerHeight] = useState(height);
	const [scrollTop, setScrollTop] = useState(0);
	const innerRef = useRef();

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const dimensions = measureElement(innerRef.current);
		setInnerHeight(dimensions.height);
	}, []);

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
		<Box
			height={height}
			flexDirection="column"
			overflow="hidden"
			borderStyle="single"
			borderColor="greenBright"
		>
			<Box
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				ref={innerRef}
				flexShrink={0}
				flexDirection="column"
				marginTop={-scrollTop}
				borderStyle="single"
				borderColor="magenta"
			>
				<Text>height: {height}</Text>
				<Text>innerHeight: {innerHeight}</Text>
				<Text>scrollTop: {scrollTop}</Text>
				{children}
			</Box>
		</Box>
	);
};
