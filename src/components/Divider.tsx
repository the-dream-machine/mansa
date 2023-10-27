import React from 'react';
import {Box, Text} from 'ink';
// import {Text} from 'ink';
import stringWidth from 'string-width';
import {ColorName} from 'chalk';

// Helpers
const getSideDividerWidth = (width: number, titleWidth: number): number =>
	(width - titleWidth) / 2;

const getNumberOfCharsPerWidth = (char: string, width: number): number =>
	width / stringWidth(char);

const PAD = ' ';

// Divider
export interface DividerProps {
	title?: string;
	width?: number;
	padding?: number;
	titlePadding?: number;
	titleColor?: ColorName;
	dividerChar?: string;
	dividerColor?: ColorName;
}

const Divider = ({
	title,
	width = 50,
	padding = 1,
	titlePadding = 1,
	titleColor = 'white',
	dividerChar = '-',
	dividerColor = 'grey',
}: DividerProps) => {
	const titleString = title
		? `${PAD.repeat(titlePadding) + title + PAD.repeat(titlePadding)}`
		: '';
	const titleWidth = stringWidth(titleString);
	const dividerWidth = getSideDividerWidth(width, titleWidth);
	const numberOfCharsPerSide = getNumberOfCharsPerWidth(
		dividerChar,
		dividerWidth,
	);
	const dividerSideString = dividerChar.repeat(numberOfCharsPerSide);
	const paddingString = PAD.repeat(padding);
	return (
		<Box width={'100%'} justifyContent="center" flexDirection="row">
			<Text>{paddingString}</Text>
			<Text color={dividerColor}>{dividerSideString}</Text>
			<Text color={titleColor}>{titleString}</Text>
			<Text color={dividerColor}>{dividerSideString}</Text>
			<Text>{paddingString}</Text>
		</Box>
	);
};

export default Divider;
