import {Box, Text, useApp, useInput} from 'ink';
import React from 'react';
import {useActor} from '@xstate/react';

import {ToolsContext} from '../ToolsProvider.js';
import {type ReadFileToolArguments} from '../../types/ToolArguments.js';
import {Colors} from '../../styles/Colors.js';
import {type MachineActor} from '../../types/MachineActor.js';
import {SectionContainer} from '../SectionContainer.js';
import {
	ReadFileToolEvent,
	type ReadFileToolMachineContext,
	type ReadFileToolMachineEvent,
	type ReadFileToolMachineState,
} from '../../machines/tools/readFileToolMachine.js';
import {Spinner} from '@inkjs/ui';

interface Props {
	id: string;
}

export const ReadFileTool = ({id}: Props) => {
	const [toolMachineState] = ToolsContext.useActor();
	const tools = toolMachineState.context.tools;
	const tool = tools.find(tool => tool.id === id);
	const toolIndex = tools.findIndex(tool => tool.id === id);
	const toolActor = toolMachineState.context.toolRefs[id];

	const toolArguments = tool?.arguments as ReadFileToolArguments;
	const reason = toolArguments.reason;
	const filePath = toolArguments.file_path;

	const [state, send] = useActor(toolActor!) as MachineActor<
		ReadFileToolMachineContext,
		ReadFileToolMachineEvent,
		ReadFileToolMachineState
	>;

	const isMachineActive = !state.done;
	const showDivider = toolIndex > 0;
	const isLoading = state.context.isLoading;
	const isSuccess = state.context.isSuccess;
	const isError = state.context.isError;
	const errorMessage = state.context.errorMessage;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape && isMachineActive) {
			exit();
		}
		if (key.return && isMachineActive) {
			send(ReadFileToolEvent.ENTER_KEY_PRESS);
		}
	});

	return (
		<SectionContainer showDivider={showDivider}>
			<Box>
				<Box
					borderStyle="round"
					borderColor={Colors.DarkGray}
					gap={1}
					paddingX={1}
				>
					{isLoading && <Spinner />}
					{isSuccess && <Text color={Colors.LightGreen}>•</Text>}
					{isError && <Text color={Colors.LightRed}>•</Text>}
					<Text color={Colors.LightGray}>
						{reason} in {filePath}
					</Text>
				</Box>
			</Box>
			{isError && (
				<Box flexDirection="column" gap={1}>
					<Text color={Colors.DarkRed}>{errorMessage}</Text>
					<Text color={Colors.LightGray}>
						Press <Text color={Colors.White}>enter</Text> to retry
					</Text>
				</Box>
			)}
		</SectionContainer>
	);
};
