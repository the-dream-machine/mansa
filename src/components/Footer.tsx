import React from 'react';
import {Box, Spacer, Text} from 'ink';
import figureSet from 'figures';
import {Colors} from './Colors.js';

type Control = 'up' | 'down' | 'tab' | 'search' | 'esc' | 'enter' | 'q';
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
		<>
			<Spacer />
			<Box>
				{controls.includes('up') && (
					<Box>
						<Text color={Colors.LightGrey}>{figureSet.triangleUp} </Text>
						<Text color={Colors.DarkGrey}>up • </Text>
					</Box>
				)}
				{controls.includes('up') && (
					<Box>
						<Text color={Colors.LightGrey}>{figureSet.triangleDown} </Text>
						<Text color={Colors.DarkGrey}>down • </Text>
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
						<Text color={Colors.LightGrey}>esc </Text>
						<Text color={Colors.DarkGrey}>exit • </Text>
					</Box>
				)}
				{controls.includes('q') && (
					<Box>
						<Text color={Colors.LightGrey}>q </Text>
						<Text color={Colors.DarkGrey}>quit • </Text>
					</Box>
				)}

				{controls.includes('enter') && (
					<Box>
						<Text color={Colors.LightGreen}>enter </Text>
						<Text color={Colors.DarkGreen} strikethrough={enterDisabled}>
							{enterLabel}
						</Text>
					</Box>
				)}
				<Spacer />
				<Text>🍥</Text>
			</Box>
		</>
	);
};
