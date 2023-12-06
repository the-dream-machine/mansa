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
	type UserActionMachineContext,
	type UserActionMachineEvent,
	type UserActionMachineState,
} from '../../../machines/userActionMachine.js';

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

	const showSuccessSection = isLoading || isSuccess || isError;

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
		showSuccessSection ? Colors.DarkGray : color;

	return (
		<PageContainer>
			<Header />
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

				{/* Code Block */}
				{/* <Box
					flexDirection="column"
					flexShrink={0}
					gap={1}
					marginX={3}
					paddingY={1}
					paddingX={2}
					borderColor={Colors.DarkGray}
					borderStyle="round"
				>
					<Text>{highlightedCode}</Text>
				</Box> */}

				{/* Press Enter to copy */}
				<Box marginLeft={3}>
					<Text color={getStateColor(Colors.LightGray)}>
						Press <Text color={getStateColor(Colors.LightGreen)}>enter</Text> to
						copy to clipboard.
					</Text>
				</Box>
			</SectionContainer>

			{showSuccessSection && (
				<SectionContainer showDivider>
					<Box flexDirection="column" gap={1}>
						{/* Loader */}
						{isLoading && (
							<Box gap={2}>
								<Spinner />
								<Text color={Colors.LightGray}>{loadingMessage}</Text>
							</Box>
						)}

						{/* Success message */}
						{isSuccess && (
							<Box flexDirection="column" gap={2} paddingTop={2}>
								<Box gap={3}>
									<Text color={Colors.LightGreen}>•</Text>
									<Text>{successMessage} 🎉</Text>
								</Box>

								<Box marginLeft={3}>
									<Text color={Colors.LightGray}>
										Press <Text color={Colors.LightGreen}>enter</Text> to go to
										the next step.
									</Text>
								</Box>
							</Box>
						)}
					</Box>
				</SectionContainer>
			)}
			<Spacer />
			<Footer
				controls={['enter', 'esc']}
				enterLabel={enterLabel}
				enterDisabled={isLoading}
			/>
		</PageContainer>
	);
};
