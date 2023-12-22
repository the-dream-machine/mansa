import React from 'react';
import {Box, Spacer, Text} from 'ink';
import {BaseColors, Colors} from '../styles/Colors.js';
import {ToolsContext} from './ToolsProvider.js';

export type FooterControl = 'tab' | 'esc';

interface Props {
	controls: FooterControl[];
	enterLabel?: string;
	enterDisabled?: boolean;
}

export const Footer = ({controls}: Props) => {
	const [state] = ToolsContext.useActor();
	const showChat = state.context.showChat;
	const showSendCommand = state.context.showSendCommand;
	const isError = state.context.isError;

	const tabLabel = showChat ? 'go back' : 'request changes';
	return (
		<Box flexShrink={0} paddingX={3} paddingY={1} width={'100%'}>
			{controls.includes('tab') && !isError && !showSendCommand && (
				<Box>
					<Text color={BaseColors.Gray500}>tab </Text>
					<Text color={Colors.DarkGray}>{tabLabel} • </Text>
				</Box>
			)}

			{controls.includes('esc') && (
				<Box>
					<Text color={BaseColors.Gray500}>esc </Text>
					<Text color={Colors.DarkGray}>exit</Text>
				</Box>
			)}

			<Spacer />
			<Text color={Colors.DarkGray}>mansa.</Text>
		</Box>
	);
};
