import {Box, Text, useApp, useInput} from 'ink';
import React from 'react';
import {ToolsContext} from '../../ToolsProvider.js';
import {type UserInputTooArguments} from '../../../types/ToolArguments.js';
import {useActor} from '@xstate/react';
import {type MachineActor} from '../../../types/MachineActor.js';
import {
	UserInputToolEvent,
	type UserInputToolMachineContext,
	type UserInputToolMachineEvent,
	type UserInputToolMachineState,
} from '../../../machines/tools/userInputToolMachine.js';
import {SectionContainer} from '../../SectionContainer.js';
import {TextInput} from '@inkjs/ui';
import {Colors} from '../../../styles/Colors.js';
import figureSet from 'figures';

interface Props {
	id: string;
}

export const UserInputTool = ({id}: Props) => {
	const [toolMachineState] = ToolsContext.useActor();
	const tools = toolMachineState.context.tools;
	const tool = tools.find(tool => tool.id === id);
	const toolActor = toolMachineState.context.toolRefs[id];

	const toolArguments = tool?.arguments as UserInputTooArguments;
	const title = toolArguments.title;
	const question = toolArguments.question;
	const placeholder = toolArguments.placeholder;

	const [state, send] = useActor(toolActor!) as MachineActor<
		UserInputToolMachineContext,
		UserInputToolMachineEvent,
		UserInputToolMachineState
	>;

	const isMachineActive = !state.done;
	const answer = state.context.answer;
	const isSubmitted = state.context.isSubmitted;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape && isMachineActive) {
			exit();
		}
	});

	return (
		<SectionContainer showDivider>
			<Text color={Colors.White} bold>
				{title}
			</Text>
			<Text color={Colors.LightGray}>{question}</Text>

			<Box flexDirection="column" marginTop={1}>
				{/* Text Input */}
				<Box>
					<Box
						borderStyle={'round'}
						borderColor={Colors.DarkGray}
						minWidth={28}
						paddingX={1}
						gap={1}
					>
						<Text color={isSubmitted ? Colors.LightGreen : Colors.LightGray}>
							•
						</Text>
						<TextInput
							defaultValue={answer}
							isDisabled={isSubmitted}
							placeholder={placeholder}
							onSubmit={answer =>
								send({type: UserInputToolEvent.SUBMIT_ANSWER, answer})
							}
						/>
					</Box>
				</Box>
				{!isSubmitted && (
					<Box marginLeft={1}>
						<Text color={Colors.LightGray}>
							Press <Text color={Colors.LightGreen}>enter</Text> to submit
						</Text>
					</Box>
				)}
			</Box>
		</SectionContainer>
	);
};
