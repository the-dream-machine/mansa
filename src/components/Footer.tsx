import React from 'react';
import {Box, Spacer, Text} from 'ink';
import figureSet from 'figures';
import {BaseColors, Colors} from './Colors.js';

type Control = 'up' | 'down' | 'tab' | 'search' | 'esc' | 'enter' | 's';
interface Props {
	controls: Control[];
	enterLabel?: string;
	enterDisabled?: boolean;
}

export const Footer = ({
	controls,
	enterLabel = 'submit',
	enterDisabled = false,
}: Props) => {
	return (
		<Box paddingY={1} flexShrink={0} width={'100%'}>
			{controls.includes('up') && (
				<Box>
					<Text color={BaseColors.Gray500}>{figureSet.triangleUp} </Text>
					<Text color={Colors.DarkGray}>up • </Text>
				</Box>
			)}
			{controls.includes('up') && (
				<Box>
					<Text color={BaseColors.Gray500}>{figureSet.triangleDown} </Text>
					<Text color={Colors.DarkGray}>down • </Text>
				</Box>
			)}
			{controls.includes('tab') && (
				<Text color="gray">
					{' '}
					• <Text color="white">tab</Text> toggle selection
				</Text>
			)}
			{controls.includes('search') && (
				<Text color="gray">
					{' '}
					• <Text color="white">type</Text> to search
				</Text>
			)}

			{controls.includes('esc') && (
				<Box>
					<Text color={BaseColors.Gray500}>esc </Text>
					<Text color={Colors.DarkGray}>exit • </Text>
				</Box>
			)}
			{controls.includes('s') && (
				<Box>
					<Text color={BaseColors.Gray400}>s </Text>
					<Text color={Colors.DarkGray}>skip • </Text>
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
			<Text>🍥</Text>
		</Box>
	);
};
