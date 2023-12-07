import React from 'react';
import {useActor} from '@xstate/react';
import {Spinner} from '@inkjs/ui';
import {Box, Spacer, Text, useApp, useInput} from 'ink';

import {StepsContext} from '../../StepsProvider.js';
import {type BaseColors, Colors} from '../../../utils/Colors.js';
import {PageContainer} from '../../PageContainer.js';
import {Footer} from '../../Footer.js';
import {Header} from '../../Header.js';
import type {Actor} from '../../../types/Actor.js';
import {SectionContainer} from '../../SectionContainer.js';
import {
	UserActionEvent,
	UserActionState,
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
	const isError = userActionMachineState.context.isError;
	const loadingMessage = userActionMachineState.context.loadingMessage;
	const successMessage = userActionMachineState.context.successMessage;
	const errorMessage = userActionMachineState.context.errorMessage;

	const isBashCommand = userActionMachineState.context.isBashCommand;

	const highlightedBashCommand = highlight(
		userActionMachineState.context.user_action?.bash_command ?? '',
		{language: 'bash', theme: defaultPrismTheme({})},
	)
		.trim()
		.replace(/(\r\n|\n|\r)/gm, ''); // trim line breaks

	const isUrl = userActionMachineState.context.isUrl;
	const url = userActionMachineState.context.user_action?.url;

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
					<Text color={Colors.White}>
						{activeStep?.step_title}{' '}
						<Text color={Colors.DarkGray}>
							(Step {activeStepIndex + 1} of {totalSteps})
						</Text>
					</Text>

					{/* Description */}
					<Box gap={2}>
						<Text color={getStateColor(Colors.LightGreen)}>•</Text>
						<Text color={getStateColor(Colors.LightGray)}>
							{activeStep?.step_description}
						</Text>
					</Box>

					{isBashCommand && (
						<>
							<Box marginLeft={3}>
								<Box
									flexGrow={0}
									borderStyle="round"
									borderColor={Colors.DarkGray}
								>
									<Text>{highlightedBashCommand}</Text>
								</Box>
							</Box>

							{/* Press Enter to copy */}
							<Box marginLeft={3}>
								<Text color={getStateColor(Colors.LightGray)}>
									Press{' '}
									<Text color={getStateColor(Colors.LightGreen)}>enter</Text> to
									copy the command.
								</Text>
							</Box>
						</>
					)}
				</SectionContainer>

				{isSuccess && (
					<SectionContainer showDivider>
						<Box flexDirection="column" gap={1}>
							{/* Success message */}
							{isSuccess && (
								<Box flexDirection="column" gap={2} paddingTop={2}>
									<Box gap={2}>
										<Text color={Colors.LightGreen}>•</Text>
										{isBashCommand && <Text>Copied to clipboard!</Text>}
										{isUrl && <Text>Opened the url in your browser!</Text>}
									</Box>

									<Box marginLeft={3}>
										<Text color={Colors.LightGray}>
											Press <Text color={Colors.LightGreen}>enter</Text> to go
											to the next step.
										</Text>
									</Box>
								</Box>
							)}
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
