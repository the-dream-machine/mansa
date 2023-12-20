import {Box, Text, useApp, useInput} from 'ink';
import React from 'react';

import {useActor} from '@xstate/react';

import {ToolsContext} from '../ToolsProvider.js';
import {type CreateFileToolArguments} from '../../types/ToolArguments.js';
import {
	CreateFileToolEvent,
	type CreateFileToolMachineContext,
	type CreateFileToolMachineEvent,
	type CreateFileToolMachineState,
} from '../../machines/tools/createFileToolMachine.js';
import {Colors} from '../../styles/Colors.js';
import {type MachineActor} from '../../types/MachineActor.js';
import {SectionContainer} from '../SectionContainer.js';

interface Props {
	id: string;
}

export const CreateFileTool = ({id}: Props) => {
	const [toolMachineState] = ToolsContext.useActor();
	const tools = toolMachineState.context.tools;
	const tool = tools.find(tool => tool.id === id);
	const toolIndex = tools.findIndex(tool => tool.id === id);
	const toolActor = toolMachineState.context.toolRefs[id];

	const toolArguments = tool?.arguments as CreateFileToolArguments;
	const title = toolArguments.title;
	const description = toolArguments.description;

	const [state, send] = useActor(toolActor!) as MachineActor<
		CreateFileToolMachineContext,
		CreateFileToolMachineEvent,
		CreateFileToolMachineState
	>;

	const isMachineActive = !state.done;
	const filePath = state.context.filePath;
	const highlightedFileContent = state.context.highlightedFileContent;
	const isSuccess = state.context.isSuccess;
	const isSubmitted = state.context.isSubmitted;
	const showDivider = toolIndex > 0;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape && isMachineActive) {
			exit();
		}
		if (key.return && isMachineActive) {
			send(CreateFileToolEvent.ENTER_KEY_PRESS);
		}
	});

	return (
		<SectionContainer showDivider={showDivider}>
			<Box flexDirection="column" gap={2}>
				<Box flexDirection="column" gap={1}>
					<Text bold color={Colors.White}>
						{title}
					</Text>
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
					<Text>{highlightedFileContent}</Text>
				</Box>
			</Box>

			{/* Press Enter Create File */}
			{!isSuccess && (
				<Text color={Colors.LightGray}>
					Press <Text color={Colors.White}>enter</Text> to create{' '}
					<Text color={Colors.White} italic>
						{filePath}
					</Text>{' '}
					and apply the code changes.
				</Text>
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
							<Text color={Colors.White}>
								Created <Text bold>{filePath}</Text>
							</Text>
						</Box>
					</Box>

					{isMachineActive && (
						<>
							{!isSubmitted && (
								<Box>
									<Text color={Colors.LightGray}>
										Press <Text color={Colors.White}>enter</Text> to go to the
										next step.
									</Text>
								</Box>
							)}
						</>
					)}
				</Box>
			)}
		</SectionContainer>
	);
};
