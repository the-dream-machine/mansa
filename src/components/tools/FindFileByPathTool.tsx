import {Box, Text, useApp, useInput} from 'ink';
import React from 'react';
import {useActor} from '@xstate/react';
import {Colors} from '../../styles/Colors.js';
import {ToolsContext} from '../ToolsProvider.js';
import {type FindFileByPathToolArguments} from '../../types/ToolArguments.js';
import {type MachineActor} from '../../types/MachineActor.js';
import {
	type FindFileByPathToolMachineContext,
	type FindFileByPathToolMachineEvent,
	type FindFileByPathToolMachineState,
} from '../../machines/tools/findFileByPathToolMachine.js';

interface Props {
	id: string;
}

export const FindFileByPathTool = ({id}: Props) => {
	const [toolMachineState] = ToolsContext.useActor();
	const tools = toolMachineState.context.tools;
	const tool = tools.find(tool => tool.id === id);
	const toolActor = toolMachineState.context.toolRefs[id];

	const toolArguments = tool?.arguments as FindFileByPathToolArguments;
	const filePath = toolArguments.file_path;

	const [state] = useActor(toolActor!) as MachineActor<
		FindFileByPathToolMachineContext,
		FindFileByPathToolMachineEvent,
		FindFileByPathToolMachineState
	>;

	const fileExists = state.context.fileExists;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
	});

	return (
		<Box paddingX={3} paddingY={1}>
			<Box>
				<Box
					borderStyle="round"
					borderColor={Colors.DarkGray}
					gap={1}
					paddingX={1}
				>
					{fileExists && <Text color={Colors.LightGreen}>•</Text>}
					{!fileExists && <Text color={Colors.LightRed}>•</Text>}
					<Text color={Colors.LightGray}>Searching for {filePath}</Text>
				</Box>
			</Box>
		</Box>
	);
};
