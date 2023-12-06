import React from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {useActor} from '@xstate/react';

import {StepsContext} from '../../StepsProvider.js';
import {type BaseColors, Colors} from '../../../utils/Colors.js';
import {PageContainer} from '../../PageContainer.js';
import {Footer} from '../../Footer.js';
import {Header} from '../../Header.js';
import {
	CreateFileEvent,
	type CreateFileMachineContext,
	type CreateFileMachineState,
	type CreateFileMachineEvent,
} from '../../../machines/createFileMachine.js';

import type {Actor} from '../../../types/Actor.js';
import {SectionContainer} from '../../SectionContainer.js';
import {Spinner} from '@inkjs/ui';
import {ScrollContainer} from '../../ScrollContainer.js';

export const CreateFileStep = () => {
	const [stepsState] = StepsContext.useActor();
	const activeStepIndex = stepsState.context.activeStepIndex;
	const activeStep = stepsState.context.steps?.[activeStepIndex];
	const activeStepActor = stepsState.context.activeStepActor;
	const totalSteps = stepsState.context.steps?.length;

	const [createFileMachineState, createFileMachineSend] = useActor(
		activeStepActor!,
	) as Actor<
		CreateFileMachineContext,
		CreateFileMachineEvent,
		CreateFileMachineState
	>;

	const highlightedCode = createFileMachineState.context.highlightedCode;
	const filepath = createFileMachineState.context.filePath;
	const enterLabel = createFileMachineState.context.enterLabel;
	const isLoading = createFileMachineState.context.isLoading;
	const isSuccess = createFileMachineState.context.isSuccess;
	const isError = createFileMachineState.context.isError;
	const loadingMessage = createFileMachineState.context.loadingMessage;
	const successMessage = createFileMachineState.context.successMessage;
	const errorMessage = createFileMachineState.context.errorMessage;

	const showNextSection = isLoading || isSuccess || isError;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			createFileMachineSend(CreateFileEvent.ENTER_KEY_PRESSED);
		}
	});

	const getStateColor = (color: Colors | BaseColors) =>
		showNextSection ? Colors.DarkGray : color;

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
					<Box gap={2} marginTop={1}>
						<Text color={getStateColor(Colors.LightGreen)}>•</Text>
						<Text color={getStateColor(Colors.LightGray)}>
							{activeStep?.step_description}
						</Text>
					</Box>

					{/* Code Block */}
					<Box
						flexDirection="column"
						flexShrink={0}
						gap={1}
						marginX={3}
						paddingY={1}
						paddingX={2}
						borderColor={Colors.DarkGray}
						borderStyle="round"
					>
						<Text color={Colors.DarkGray} italic>
							{filepath}
						</Text>
						<Text>{highlightedCode}</Text>
					</Box>

					{/* Press Enter Create File */}
					<Box marginLeft={3}>
						<Text color={getStateColor(Colors.LightGray)}>
							Press <Text color={getStateColor(Colors.LightGreen)}>enter</Text>{' '}
							to create the{' '}
							<Text color={getStateColor(Colors.White)} italic>
								{filepath}
							</Text>{' '}
							file and apply the code changes.
						</Text>
					</Box>
				</SectionContainer>

				{showNextSection && (
					<SectionContainer showDivider>
						<Box flexDirection="column" gap={1}>
							{/* Loader */}
							{isLoading && (
								<Box gap={2}>
									<Spinner />
									<Text color={Colors.LightGray}>
										Creating{' '}
										<Text color={Colors.White} italic>
											{filepath}
										</Text>
									</Text>
								</Box>
							)}

							{/* Success message */}
							{isSuccess && (
								<Box flexDirection="column" gap={1} paddingTop={2}>
									<Box gap={2}>
										<Text color={Colors.LightGreen}>•</Text>
										<Text color={Colors.LightGray}>
											Successfully created{' '}
											<Text color={Colors.White} italic>
												{filepath}
											</Text>
										</Text>
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
