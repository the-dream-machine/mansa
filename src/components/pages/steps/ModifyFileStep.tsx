import React from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {useActor} from '@xstate/react';

import {StepsContext} from '../../StepsProvider.js';
import {BaseColors, Colors} from '../../Colors.js';
import {PageContainer} from '../../PageContainer.js';
import {Footer} from '../../Footer.js';
import {Header} from '../../Header.js';
import {CreateFileEvent} from '../../../machines/createFileMachine.js';
import {ScrollContainer} from '../../ScrollContainer.js';
import type {Actor} from '../../../types/Actor.js';
import {
	type ModifyFileMachineContext,
	type ModifyFileMachineEvent,
	type ModifyFileMachineState,
	ModifyFileState,
	ModifyFileEvent,
} from '../../../machines/modifyFileMachine.js';

export const ModifyFileStep = () => {
	const [stepsState] = StepsContext.useActor();
	const activeStepIndex = stepsState.context.activeStepIndex;
	const activeStep = stepsState.context.steps?.[activeStepIndex];
	const activeStepActor = stepsState.context.activeStepActor;
	const totalSteps = stepsState.context.steps?.length;

	const [modifyFileMachineState, modifyFileMachineSend] = useActor(
		activeStepActor!,
	) as Actor<
		ModifyFileMachineContext,
		ModifyFileMachineEvent,
		ModifyFileMachineState
	>;

	const formattedRawCode = modifyFileMachineState.context.formattedRawCode;
	const filepath = modifyFileMachineState.context.filePath;
	const enterLabel = modifyFileMachineState.context.enterLabel;

	const isLoading = modifyFileMachineState.matches(
		ModifyFileState.FETCHING_FILE_EDITS,
	);
	// const isSuccess = modifyFileMachineState.matches(
	// 	ModifyFileState.CREATE_FILE_SUCCESS_IDLE,
	// );
	const isSuccess = false;
	const isError = false;
	// const isError = modifyFileMachineState.matches(
	// 	CreateFileState.CREATE_FILE_ERROR_IDLE,
	// );

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			modifyFileMachineSend(ModifyFileEvent.ENTER_PRESSED);
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
									to generate the code changes for{' '}
									<Text color={getStateColor(BaseColors.Gray500)} italic>
										{filepath}
									</Text>
									.
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
							{filepath} (Original file, no edits made yet.)
						</Text>

						<ScrollContainer>
							<Box paddingBottom={8}>
								<Text color={Colors.DarkGray}>{formattedRawCode}</Text>
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
