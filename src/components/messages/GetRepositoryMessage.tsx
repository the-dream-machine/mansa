import React from 'react';
import {type Message} from '../../types/Message.js';
import {Box, Text, useApp, useInput} from 'ink';
import {Colors} from '../../styles/Colors.js';

interface Props {
	message: Message;
}

export const GetRepositoryMessage = ({message}: Props) => {
	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
	});

	return (
		<Box>
			<Box
				gap={2}
				flexGrow={0}
				borderStyle="round"
				borderColor={Colors.DarkGray}
			>
				<Text>🙈 {message.text}</Text>
			</Box>
		</Box>
	);
};
