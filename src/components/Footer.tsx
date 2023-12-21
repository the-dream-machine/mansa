import React from 'react';
import {Box, Text} from 'ink';
import {BaseColors, Colors} from '../styles/Colors.js';

export type FooterControl = 'tab' | 'esc' | 'enter';

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
			{controls.includes('esc') && (
				<Box>
					<Text color={BaseColors.Gray600}>esc </Text>
					<Text color={Colors.DarkGray}>exit • </Text>
				</Box>
			)}

			{controls.includes('tab') && (
				<Box>
					<Text color={BaseColors.Gray600}>tab </Text>
					<Text color={Colors.DarkGray}>make changes</Text>
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
		</Box>
	);
};
