import {TextInput} from '@inkjs/ui';
import {Box, Text, useApp, useInput} from 'ink';
import React from 'react';
import {Colors} from '../styles/Colors.js';
import {ToolsContext} from './ToolsProvider.js';
import {ToolEvent} from '../types/ToolMachine.js';

export const UserChat = () => {
	const [_, toolMachineSend] = ToolsContext.useActor();

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
	});

	return (
		<Box marginLeft={3} flexDirection="column" gap={1} marginBottom={2}>
			<Box
				borderStyle="single"
				borderTop={false}
				borderBottom={false}
				borderRight={false}
				gap={1}
				paddingX={1}
				paddingY={1}
			>
				<TextInput
					placeholder="Type something..."
					onSubmit={values =>
						toolMachineSend({
							type: ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT,
							output: JSON.stringify({user_request: values}),
						})
					}
				/>
			</Box>
			<Text color={Colors.LightGray}>
				Press <Text color={Colors.White}>enter</Text> to submit.
			</Text>
		</Box>
	);
};
