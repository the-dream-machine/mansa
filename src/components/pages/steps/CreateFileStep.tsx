import React from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {useActor} from '@xstate/react';

import {StepsContext} from '../../StepsProvider.js';
import {BaseColors, Colors} from '../../Colors.js';
import {PageContainer} from '../../PageContainer.js';
import {Footer} from '../../Footer.js';
import {Header} from '../../Header.js';
import {
	CreateFileState,
	CreateFileEvent,
	type CreateFileMachineContext,
	type CreateFileMachineState,
	type CreateFileMachineEvent,
} from '../../../machines/createFileMachine.js';
import {ScrollContainer} from '../../ScrollContainer.js';
import type {Actor} from '../../../types/Actor.js';

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

	const isLoading = createFileMachineState.matches(
		CreateFileState.CREATING_FILE,
	);
	const isSuccess = createFileMachineState.matches(
		CreateFileState.CREATE_FILE_SUCCESS_IDLE,
	);
	const isError = createFileMachineState.matches(
		CreateFileState.CREATE_FILE_ERROR_IDLE,
	);

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			createFileMachineSend(CreateFileEvent.CREATE_FILE);
		}
	});

	const getStateColor = (color: Colors | BaseColors) =>
		isSuccess ? Colors.DarkGray : color;

	return (
		<PageContainer>
			<Header
				isLoading={isLoading}
				isSuccess={isSuccess}
				isError={isError}
				loadingMessage={`Creating ${filepath}`}
				successMessage="Created successfully"
			/>
			<Box>
				<Box flexDirection="row" gap={4}>
					{/* Left Block */}
					<Box flexDirection="column" gap={1}>
						{/* Title */}
						<Text color={BaseColors.White}>
							{activeStep?.step_title}{' '}
							<Text color={Colors.DarkGray}>
								(Step {activeStepIndex + 1} of {totalSteps})
							</Text>
						</Text>

						{/* Description step */}
						<Box gap={1}>
							<Text color={getStateColor(Colors.LightGreen)}>•</Text>
							<Box flexDirection="column" gap={1}>
								<Text color={getStateColor(Colors.LightGray)}>
									{activeStep?.step_description}
								</Text>
								<Text color={getStateColor(Colors.DarkGray)}>
									Press{' '}
									<Text color={getStateColor(BaseColors.Gray500)}>enter</Text>{' '}
									to create{' '}
									<Text color={getStateColor(BaseColors.Gray500)} italic>
										{filepath}
									</Text>{' '}
									and apply the code changes.
								</Text>
							</Box>
						</Box>

						{/* Success step */}
						{isSuccess && (
							<Box gap={1} flexShrink={0} marginTop={1}>
								<Text color={Colors.LightGreen}>•</Text>
								<Text color={Colors.LightGray}>
									Press <Text color={Colors.White}>enter</Text> to go to the
									next step.
								</Text>
							</Box>
						)}
					</Box>
					<Spacer />

					{/* Code block */}
					<Box
						minWidth={50}
						flexDirection="column"
						flexShrink={0}
						gap={1}
						paddingTop={1}
						paddingX={2}
						marginTop={2}
						borderColor={BaseColors.Gray800}
						borderStyle="round"
					>
						<Text color={BaseColors.Gray700} italic>
							{filepath}
						</Text>

						<ScrollContainer>
							<Box paddingBottom={8}>
								<Text>{highlightedCode}</Text>
							</Box>
						</ScrollContainer>
					</Box>
				</Box>
			</Box>
			<Spacer />
			<Footer
				controls={['enter', 'esc', 'up', 'down']}
				enterLabel={enterLabel}
				enterDisabled={isLoading}
			/>
		</PageContainer>
	);
};
