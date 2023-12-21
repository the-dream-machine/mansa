import {Box, Text, useApp, useInput} from 'ink';
import React from 'react';
import {ToolsContext} from '../ToolsProvider.js';
import {type UserActionToolArguments} from '../../types/ToolArguments.js';
import {useActor} from '@xstate/react';
import {type MachineActor} from '../../types/MachineActor.js';
import {SectionContainer} from '../SectionContainer.js';
import {Colors} from '../../styles/Colors.js';
import {
	UserActionToolEvent,
	type UserActionToolMachineContext,
	type UserActionToolMachineEvent,
	type UserActionToolMachineState,
} from '../../machines/tools/userActionToolMachine.js';
import {highlight} from 'prismjs-terminal';
import {defaultPrismTheme} from '../../utils/prismThemes.js';
import loadLanguages from 'prismjs/components/index.js';

interface Props {
	id: string;
}

export const UserActionTool = ({id}: Props) => {
	const [toolMachineState] = ToolsContext.useActor();
	const showChat = toolMachineState.context.showChat;
	const tools = toolMachineState.context.tools;
	const tool = tools.find(tool => tool.id === id);
	const toolActor = toolMachineState.context.toolRefs[id];
	const isToolActive = tool?.status === 'active';

	const toolArguments = tool?.arguments as UserActionToolArguments;
	const title = toolArguments.title;
	const instructions = toolArguments.instructions;

	const [state, send] = useActor(toolActor!) as MachineActor<
		UserActionToolMachineContext,
		UserActionToolMachineEvent,
		UserActionToolMachineState
	>;

	const userAction = state.context.actionItem;
	const isSuccess = state.context.isSuccess;

	loadLanguages('bash');
	const userActionHighlighted = highlight(userAction, {
		language: 'bash',
		theme: defaultPrismTheme({}),
	})
		.split('\n') // Remove newlines
		.join('')
		.trim();

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape && isToolActive) {
			exit();
		}
		if (key.return && !showChat && isToolActive) {
			send({type: UserActionToolEvent.ENTER_KEY_PRESS});
		}
	});

	return (
		<SectionContainer showDivider>
			<Text color={Colors.White} bold>
				{title}
			</Text>
			<Text color={Colors.LightGray}>{instructions}</Text>

			<Box flexDirection="column" marginTop={1} gap={1}>
				<Box>
					<Box borderStyle={'round'} borderColor={Colors.DarkGray} gap={1}>
						<Text>{userActionHighlighted}</Text>
					</Box>
				</Box>

				{!isSuccess && !showChat && (
					<Box>
						<Text color={Colors.LightGray}>
							Press <Text color={Colors.White}>enter</Text> to copy to
							clipboard.
						</Text>
					</Box>
				)}

				{isSuccess && (
					<Box flexDirection="column" gap={1}>
						<Box>
							<Box
								gap={1}
								paddingX={1}
								borderStyle="round"
								borderColor={Colors.DarkGray}
							>
								<Text color={Colors.LightGreen}>•</Text>
								<Text color={Colors.White}>Copied to clipboard</Text>
							</Box>
						</Box>

						{isToolActive && (
							<Box>
								<Text color={Colors.LightGray}>
									Press <Text color={Colors.White}>enter</Text> to go to the
									next step.
								</Text>
							</Box>
						)}
					</Box>
				)}
			</Box>
		</SectionContainer>
	);
};
