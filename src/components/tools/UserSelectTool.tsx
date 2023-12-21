import {Box, Text, useApp, useInput} from 'ink';
import React from 'react';

import {useActor} from '@xstate/react';

import {type Option, Select} from '@inkjs/ui';
import {ToolsContext} from '../ToolsProvider.js';
import {type UserSelectToolArguments} from '../../types/ToolArguments.js';
import {Colors} from '../../styles/Colors.js';
import {type MachineActor} from '../../types/MachineActor.js';
import {SectionContainer} from '../SectionContainer.js';
import {
	type UserSelectToolMachineContext,
	type UserSelectToolMachineEvent,
	type UserSelectToolMachineState,
	UserSelectToolEvent,
} from '../../machines/tools/userSelectToolMachine.js';

interface Props {
	id: string;
}

export const UserSelectTool = ({id}: Props) => {
	const [toolMachineState] = ToolsContext.useActor();
	const showChat = toolMachineState.context.showChat;
	const tools = toolMachineState.context.tools;
	const tool = tools.find(tool => tool.id === id);
	const toolIndex = tools.findIndex(tool => tool.id === id);
	const toolActor = toolMachineState.context.toolRefs[id];
	const isToolActive = tool?.status === 'active';

	const toolArguments = tool?.arguments as UserSelectToolArguments;
	const title = toolArguments.title;
	const question = toolArguments.question;

	const [state, send] = useActor(toolActor!) as MachineActor<
		UserSelectToolMachineContext,
		UserSelectToolMachineEvent,
		UserSelectToolMachineState
	>;

	const showDivider = toolIndex > 0;

	const contextOptions = state.context.options;
	const selectedOption = state.context.selectedOption;
	const options: Option[] = contextOptions.map(contextOption => ({
		label: contextOption,
		value: contextOption,
	}));

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape && isToolActive) {
			exit();
		}
	});

	return (
		<SectionContainer showDivider={showDivider}>
			<Text bold>{title}</Text>
			<Text color={Colors.LightGray}>{question}</Text>

			<Box>
				<Box flexDirection="column">
					<Select
						options={options}
						highlightText={selectedOption}
						isDisabled={!isToolActive || showChat}
						onChange={option =>
							send({type: UserSelectToolEvent.SELECT_OPTION, option})
						}
					/>
				</Box>
			</Box>

			{isToolActive && !showChat && (
				<Text color={Colors.LightGray}>
					Press <Text color={Colors.White}>enter</Text> to select an option.
				</Text>
			)}
		</SectionContainer>
	);
};
