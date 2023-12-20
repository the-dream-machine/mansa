import React from 'react';
import {Box, Spacer, Text} from 'ink';
import figureSet from 'figures';
import {BaseColors, Colors} from '../styles/Colors.js';

export type FooterControl =
	| 'up'
	| 'down'
	| 'tab'
	| 'search'
	| 'esc'
	| 'enter'
	| 's';

interface Props {
	controls: FooterControl[];
	enterLabel?: string;
	enterDisabled?: boolean;
}

export const Footer = ({
	controls,
	enterLabel = 'submit',
	enterDisabled = false,
}: Props) => {
	return (
		<Box flexShrink={0} paddingX={3} paddingY={1} width={'100%'}>
			{controls.includes('up') && (
				<Box>
					<Text color={BaseColors.Gray600}>{figureSet.triangleUp} </Text>
					<Text color={Colors.DarkGray}>up • </Text>
				</Box>
			)}
			{controls.includes('up') && (
				<Box>
					<Text color={BaseColors.Gray600}>{figureSet.triangleDown} </Text>
					<Text color={Colors.DarkGray}>down • </Text>
				</Box>
			)}
			{controls.includes('tab') && (
				<Box>
					<Text color={BaseColors.Gray600}>tab </Text>
					<Text color={Colors.DarkGray}>next • </Text>
				</Box>
			)}

			{controls.includes('search') && (
				<Text color="gray">
					{' '}
					• <Text color="white">type</Text> to search
				</Text>
			)}

			{controls.includes('s') && (
				<Box>
					<Text color={BaseColors.Gray600}>s </Text>
					<Text color={Colors.DarkGray}>skip • </Text>
				</Box>
			)}

			{controls.includes('esc') && (
				<Box>
					<Text color={BaseColors.Gray600}>esc </Text>
					<Text color={Colors.DarkGray}>exit • </Text>
				</Box>
			)}

			{controls.includes('enter') && (
				<Box>
					<Text color={enterDisabled ? Colors.DarkGray : BaseColors.Green700}>
						enter{' '}
					</Text>
					<Text color={enterDisabled ? Colors.DarkGray : BaseColors.Green900}>
						{enterLabel}
					</Text>
				</Box>
			)}
			<Spacer />
			{/* <Text color={Colors.DarkGray}>🜲</Text> */}
		</Box>
	);
};
