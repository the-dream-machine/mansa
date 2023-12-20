import {Box, Text, useApp, useInput} from 'ink';
import React from 'react';

import {useActor} from '@xstate/react';

import {Spinner} from '@inkjs/ui';
import {ToolsContext} from '../../ToolsProvider.js';
import {type CreateFileToolArguments} from '../../../types/ToolArguments.js';
import {
	CreateFileToolEvent,
	type CreateFileToolMachineContext,
	type CreateFileToolMachineEvent,
	type CreateFileToolMachineState,
} from '../../../machines/tools/createFileToolMachine.js';
import {Colors} from '../../../styles/Colors.js';
import {type MachineActor} from '../../../types/MachineActor.js';
import {SectionContainer} from '../../SectionContainer.js';
import figureSet from 'figures';

interface Props {
	id: string;
}

export const CreateFileTool = ({id}: Props) => {
	const [toolMachineState] = ToolsContext.useActor();
	const tools = toolMachineState.context.tools;
	const tool = tools.find(tool => tool.id === id);
	const toolIndex = tools.findIndex(tool => tool.id === id);
	const toolActor = toolMachineState.context.toolRefs[id];
	const toolStatus = tool?.status;

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
	const isLoading = state.context.isLoading;
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
			<Text bold>{title}</Text>
			<Text color={Colors.LightGray}>{description}</Text>

			{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
			{/* @ts-ignore */}
			<Text>{state.value}</Text>
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

			{/* Press Enter Create File */}
			{!isLoading && !isSuccess && (
				<Text color={Colors.LightGray}>
					Press <Text color={Colors.LightGreen}>enter</Text> to create{' '}
					<Text color={Colors.White} italic>
						{filePath}
					</Text>{' '}
					and apply the code changes.
				</Text>
			)}

			{/* Loader */}
			{isLoading && (
				<Box>
					<Box
						gap={1}
						paddingX={1}
						borderStyle="round"
						borderColor={Colors.DarkGray}
					>
						<Text color={Colors.LightYellow}>•</Text>
						<Text color={Colors.LightGray}>
							Creating{' '}
							<Text color={Colors.White} italic>
								{filePath}
							</Text>
						</Text>
					</Box>
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
								Created{' '}
								<Text color={Colors.White} italic>
									{filePath}
								</Text>
							</Text>
						</Box>
					</Box>

					{isMachineActive && (
						<>
							{!isSubmitted && (
								<Box>
									<Text color={Colors.LightGray}>
										Press <Text color={Colors.LightGreen}>enter</Text> to go to
										the next step.
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
