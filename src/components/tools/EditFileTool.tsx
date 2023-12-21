import {Box, Text, useApp, useInput} from 'ink';
import React from 'react';

import {useActor} from '@xstate/react';

import {ToolsContext} from '../ToolsProvider.js';
import {type EditFileToolArguments} from '../../types/ToolArguments.js';
import {Colors} from '../../styles/Colors.js';
import {type MachineActor} from '../../types/MachineActor.js';
import {SectionContainer} from '../SectionContainer.js';
import {
	EditFileToolEvent,
	type EditFileToolMachineContext,
	type EditFileToolMachineEvent,
	type EditFileToolMachineState,
} from '../../machines/tools/editFileToolMachine.js';

interface Props {
	id: string;
}

export const EditFileTool = ({id}: Props) => {
	const [toolMachineState] = ToolsContext.useActor();
	const showChat = toolMachineState.context.showChat;
	const tools = toolMachineState.context.tools;
	const tool = tools.find(tool => tool.id === id);
	const toolActor = toolMachineState.context.toolRefs[id];

	const toolArguments = tool?.arguments as EditFileToolArguments;
	const title = toolArguments.title;
	const description = toolArguments.description;

	const [state, send] = useActor(toolActor!) as MachineActor<
		EditFileToolMachineContext,
		EditFileToolMachineEvent,
		EditFileToolMachineState
	>;

	const isMachineActive = !state.done;
	const filePath = state.context.filePath;
	const highlightedDiffFile = state.context.highlightedDiffFile;
	const isLoading = state.context.isLoading;
	const isSuccess = state.context.isSuccess;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape && isMachineActive) {
			exit();
		}
		if (key.return && showChat && isMachineActive) {
			send(EditFileToolEvent.ENTER_KEY_PRESS);
		}
	});

	return (
		<SectionContainer showDivider>
			<Box flexDirection="column" gap={1}>
				<Text color={Colors.White}>{title}</Text>
				<Text color={Colors.LightGray}>{description}</Text>
			</Box>

			{/* Code Block */}
			<Box
				flexDirection="column"
				flexShrink={0}
				gap={1}
				paddingTop={1}
				paddingX={2}
				borderColor={Colors.DarkGray}
				borderStyle="round"
			>
				<Text color={Colors.DarkGray}>{filePath}</Text>
				<Text>{highlightedDiffFile}</Text>
			</Box>

			{/* Press Enter Create File */}
			{!isLoading && !isSuccess && !showChat && (
				<Text color={Colors.LightGray}>
					Press <Text color={Colors.White}>enter</Text> to apply these changes
					to{' '}
					<Text color={Colors.White} italic>
						{filePath}
					</Text>
					.
				</Text>
			)}

			{/* Loader */}
			{isLoading && (
				<Box gap={1}>
					<Text color={Colors.LightYellow}>•</Text>
					<Text color={Colors.LightGray}>
						Editing{' '}
						<Text color={Colors.White} italic>
							{filePath}
						</Text>
					</Text>
				</Box>
			)}

			{/* Success message */}
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
							<Text color={Colors.LightGray}>
								Successfully edited{' '}
								<Text color={Colors.White} italic>
									{filePath}
								</Text>
							</Text>
						</Box>
					</Box>

					{isMachineActive && (
						<Box>
							<Text color={Colors.LightGray}>
								Press <Text color={Colors.White}>enter</Text> to go to the next
								step.
							</Text>
						</Box>
					)}
				</Box>
			)}
		</SectionContainer>
	);
};
