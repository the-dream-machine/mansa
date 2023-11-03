import React from 'react';
import {Box, Spacer, Text} from 'ink';
import figureSet from 'figures';

type Control = 'up' | 'down' | 'tab' | 'search' | 'esc' | 'enter';
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
			<Box paddingBottom={1}>
				{controls.includes('up') && (
					<Text color="gray">
						<Text color="white">{figureSet.triangleUp}</Text> up
					</Text>
				)}
				{controls.includes('up') && (
					<Text color="gray">
						{' '}
						• <Text color="white">{figureSet.triangleDown}</Text> down
					</Text>
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

				<Spacer />

				{controls.includes('esc') && (
					<Text color="gray">
						<Text color="white">esc </Text>
						exit
					</Text>
				)}

				{controls.includes('enter') && (
					<Text color="gray">
						{' '}
						• <Text color={enterDisabled ? 'gray' : 'white'}>enter </Text>
						{enterLabel}
					</Text>
				)}
			</Box>
		</>
	);
};
