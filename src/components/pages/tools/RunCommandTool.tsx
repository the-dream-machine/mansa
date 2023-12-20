import {useActor} from '@xstate/react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import React from 'react';

import {ToolsContext} from '../../ToolsProvider.js';
import {Colors} from '../../../styles/Colors.js';
import {
	RunCommandToolEvent,
	type RunCommandToolMachineContext,
	type RunCommandToolMachineEvent,
	type RunCommandToolMachineState,
} from '../../../machines/tools/runCommandToolMachine.js';
import {type RunCommandToolArguments} from '../../../types/ToolArguments.js';
import {type MachineActor} from '../../../types/MachineActor.js';
import {SectionContainer} from '../../SectionContainer.js';
import {Spinner} from '@inkjs/ui';
import figureSet from 'figures';
import {PageContainer} from '../../PageContainer.js';
import {Header} from '../../Header.js';
import {Footer} from '../../Footer.js';

interface Props {
	id: string;
}

export const RunCommandTool = ({id}: Props) => {
	const [toolMachineState] = ToolsContext.useActor();
	const library = toolMachineState.context.library;
	const tool = toolMachineState.context.tools.find(tool => tool.id === id);
	const toolActor = toolMachineState.context.toolRefs[id];

	const toolArguments = tool?.arguments as RunCommandToolArguments;
	const title = toolArguments.title;
	const description = toolArguments.description;

	const [state, send] = useActor(toolActor!) as MachineActor<
		RunCommandToolMachineContext,
		RunCommandToolMachineEvent,
		RunCommandToolMachineState
	>;

	const isMachineActive = !state.done;
	const highlightedCommand = state.context.highlightedCommand
		.split('\n') // Remove newlines
		.join('')
		.trim();
	const highlightedCommandOutput = state.context.highlightedCommandOutput;
	const showLogsSection = state.context.showLogs;
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
			send(RunCommandToolEvent.ENTER_KEY_PRESS);
		}
	});

	return (
		<PageContainer>
			<Header
				title={library?.name}
				backgroundColor={library?.backgroundColor}
				textColor={library?.textColor}
			/>

			<SectionContainer>
				<Box flexDirection="column">
					<Text bold>{title}</Text>

					<Box marginTop={2} flexDirection="column">
						<Text color={Colors.LightGray}>{description}</Text>

						<Box marginLeft={0}>
							<Box borderStyle="round" borderColor={Colors.DarkGray}>
								<Text>{highlightedCommand}</Text>
							</Box>
						</Box>
					</Box>
				</Box>

				{!showLogsSection && (
					<Box marginTop={2}>
						<Text color={Colors.DarkGray}>
							Press <Text color={Colors.LightGray}>enter</Text> to run the
							command.
						</Text>
					</Box>
				)}

				{showLogsSection && (
					<>
						{/* Command */}
						{highlightedCommandOutput && (
							<Box gap={1} flexDirection="column">
								<Box gap={1}>
									<Text color={Colors.DarkGray}>{figureSet.triangleDown}</Text>
									<Text color={Colors.LightGray}>Logs</Text>
								</Box>
								<Box
									paddingLeft={2}
									flexGrow={0}
									borderStyle="single"
									borderColor={Colors.DarkGray}
									borderTop={false}
									borderRight={false}
									borderBottom={false}
								>
									<Text color={Colors.DarkGray}>
										{highlightedCommandOutput}
									</Text>
								</Box>
							</Box>
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
									<Spinner />
									<Text color={Colors.LightGray}>Running command</Text>
								</Box>
							</Box>
						)}
						{isSuccess && (
							<Box>
								<Box
									gap={1}
									paddingX={1}
									borderStyle="round"
									borderColor={Colors.DarkGray}
								>
									<Text color={Colors.LightGreen}>•</Text>
									<Text color={Colors.White}>Run successful</Text>
								</Box>
							</Box>
						)}
						{isError && (
							<Box>
								<Box
									gap={1}
									paddingX={1}
									borderStyle="round"
									borderColor={Colors.DarkGray}
								>
									<Text color={Colors.LightRed}>•</Text>
									<Text color={Colors.LightGray}>Run error {errorMessage}</Text>
								</Box>
							</Box>
						)}

						{isSuccess && (
							<Text color={Colors.DarkGray}>
								Press <Text color={Colors.DarkGray}>enter</Text> to go to the
								next step.
							</Text>
						)}
						{isError && (
							<Text color={Colors.DarkGray}>
								Press <Text color={Colors.LightGray}>enter</Text> to retry.
							</Text>
						)}
					</>
				)}
			</SectionContainer>

			{isMachineActive && (
				<>
					<Spacer />
					<Footer
						enterDisabled={false}
						enterLabel={''}
						controls={['up', 'down', 'esc', 'enter']}
					/>
				</>
			)}
		</PageContainer>
	);
};
