import React from 'react';
import {useActor} from '@xstate/react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';

import {StepsContext} from '../../StepsProvider.js';
import {type BaseColors, Colors} from '../../../styles/Colors.js';
import {PageContainer} from '../../PageContainer.js';
import {Footer} from '../../Footer.js';
import {Header} from '../../Header.js';
import type {Actor} from '../../../types/Actor.js';
import {SectionContainer} from '../../SectionContainer.js';
import {
	UserActionEvent,
	type UserActionMachineContext,
	type UserActionMachineEvent,
	type UserActionMachineState,
} from '../../../machines/userActionMachine.js';
import {highlight} from 'prismjs-terminal';
import loadLanguages from 'prismjs/components/index.js';
import {defaultPrismTheme} from '../../../utils/prismThemes.js';
import {ScrollContainer} from '../../ScrollContainer.js';

loadLanguages('bash');
export const UserActionStep = () => {
	const [stepsState] = StepsContext.useActor();
	const activeStepIndex = stepsState.context.activeStepIndex;
	const activeStep = stepsState.context.steps?.[activeStepIndex];
	const activeStepActor = stepsState.context.activeStepActor;
	const totalSteps = stepsState.context.steps?.length;

	const [userActionMachineState, userActionMachineSend] = useActor(
		activeStepActor!,
	) as Actor<
		UserActionMachineContext,
		UserActionMachineEvent,
		UserActionMachineState
	>;

	const enterLabel = userActionMachineState.context.enterLabel;
	const isLoading = userActionMachineState.context.isLoading;
	const isSuccess = userActionMachineState.context.isSuccess;
	const isBashCommand = userActionMachineState.context.isBashCommand;
	const isUrl = userActionMachineState.context.isUrl;
	const url = userActionMachineState.context.user_action?.url;
	const highlightedBashCommand = highlight(
		userActionMachineState.context.user_action?.bash_command ?? '',
		{language: 'bash', theme: defaultPrismTheme({})},
	)
		.split('\n') // Trim newlines
		.join('')
		.trim();

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			userActionMachineSend(UserActionEvent.ENTER_KEY_PRESS);
		}
	});

	const getStateColor = (color: Colors | BaseColors) =>
		isSuccess ? Colors.DarkGray : color;

	return (
		<PageContainer>
			<Header />
			<ScrollContainer>
				<SectionContainer>
					{/* Title */}
					<Box paddingBottom={1}>
						<Text color={Colors.White}>
							{activeStep?.step_title}{' '}
							<Text color={Colors.DarkGray}>
								(Step {activeStepIndex + 1} of {totalSteps})
							</Text>
						</Text>
					</Box>

					{/* Description */}
					<Text color={getStateColor(Colors.LightGray)}>
						{activeStep?.step_description}
					</Text>

					{isBashCommand && (
						<Box flexDirection="column" gap={1}>
							<Box>
								<Box
									flexGrow={0}
									borderStyle="round"
									borderColor={Colors.DarkGray}
								>
									<Text>{highlightedBashCommand}</Text>
								</Box>
							</Box>

							{/* Press Enter to copy */}
							<Box>
								<Text color={getStateColor(Colors.LightGray)}>
									Press{' '}
									<Text color={getStateColor(Colors.LightGreen)}>enter</Text> to
									copy the command.
								</Text>
							</Box>
						</Box>
					)}
					{isUrl && (
						<Box flexDirection="column" gap={1}>
							<Box>
								<Box
									flexGrow={0}
									borderStyle="round"
									borderColor={Colors.DarkGray}
									paddingX={1}
								>
									<Text color={Colors.LightYellow}>{url}</Text>
								</Box>
							</Box>

							{/* Press Enter to copy */}
							<Box>
								<Text color={getStateColor(Colors.LightGray)}>
									Press{' '}
									<Text color={getStateColor(Colors.LightGreen)}>enter</Text> to
									open the url in your browser.
								</Text>
							</Box>
						</Box>
					)}
				</SectionContainer>

				{isSuccess && (
					<SectionContainer showDivider>
						{/* Success message */}
						<Box flexDirection="column" gap={2}>
							<Box gap={1}>
								<Text color={Colors.LightGreen}>•</Text>
								{isBashCommand && (
									<Text color={Colors.LightGray}>
										Copied the command to your clipboard. Run the command in a
										new terminal window/tab then continue the walkthrough.
									</Text>
								)}
								{isUrl && (
									<Text color={Colors.LightGray}>
										Opened the url in your browser.
									</Text>
								)}
							</Box>

							<Box marginLeft={2}>
								<Text color={Colors.LightGray}>
									Press <Text color={Colors.LightGreen}>enter</Text> to go to
									the next step.
								</Text>
							</Box>
						</Box>
					</SectionContainer>
				)}
			</ScrollContainer>
			<Spacer />
			<Footer
				controls={['up', 'down', 'enter', 'esc']}
				enterLabel={enterLabel}
				enterDisabled={isLoading}
			/>
		</PageContainer>
	);
};
