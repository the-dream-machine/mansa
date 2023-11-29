import React from 'react';
import {useActor} from '@xstate/react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';

import {StepsContext} from '../../StepsProvider.js';
import {BaseColors, Colors} from '../../../utils/Colors.js';
import {PageContainer} from '../../PageContainer.js';
import {Footer} from '../../Footer.js';
import {Header} from '../../Header.js';
import type {Actor} from '../../../types/Actor.js';
import {
	type ModifyFileMachineContext,
	type ModifyFileMachineEvent,
	type ModifyFileMachineState,
	ModifyFileEvent,
} from '../../../machines/modifyFileMachine.js';
import {ScrollContainer} from '../../ScrollContainer.js';

export const ModifyFileStep = () => {
	const [stepsState] = StepsContext.useActor();
	const stepsContext = stepsState.context;
	const activeStepIndex = stepsContext.activeStepIndex;
	const activeStep = stepsContext.steps?.[activeStepIndex];
	const activeStepActor = stepsContext.activeStepActor;
	const totalSteps = stepsContext.steps?.length;

	const [modifyFileMachineState, modifyFileMachineSend] = useActor(
		activeStepActor!,
	) as Actor<
		ModifyFileMachineContext,
		ModifyFileMachineEvent,
		ModifyFileMachineState
	>;

	const modifyFileMachineContext = modifyFileMachineState.context;

	const originalFileFormattedCode =
		modifyFileMachineContext.originalFileFormattedCode;
	const filepath = modifyFileMachineContext.originalFilePath;
	const editedFileHighlightedCode =
		modifyFileMachineContext.editedFileHighlightedCode;
	const enterLabel = modifyFileMachineContext.enterLabel;
	const isLoading = modifyFileMachineContext.isLoading;
	const isError = modifyFileMachineContext.isError;
	const isFetchEditsSuccess = modifyFileMachineContext.isFetchEditsSuccess;
	const isApplyEditsSuccess = modifyFileMachineContext.isApplyEditsSuccess;
	const isSuccess = isFetchEditsSuccess || isApplyEditsSuccess;
	const loadingMessage = modifyFileMachineContext.loadingMessage;
	const successMessage = modifyFileMachineContext.successMessage;
	const errorMessage = modifyFileMachineContext.errorMessage;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			modifyFileMachineSend(ModifyFileEvent.ENTER_KEY_PRESSED);
		}
	});

	const getStateColor = (color: Colors | BaseColors, condition: boolean) =>
		condition ? Colors.DarkGray : color;

	return (
		<PageContainer>
			<Header
				isLoading={isLoading}
				isSuccess={isSuccess}
				isError={isError}
				loadingMessage={loadingMessage}
				successMessage={successMessage}
				errorMessage={errorMessage}
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
							<Text
								color={getStateColor(Colors.LightGreen, isFetchEditsSuccess)}
							>
								•
							</Text>
							<Box flexDirection="column" gap={1}>
								<Text
									color={getStateColor(Colors.LightGray, isFetchEditsSuccess)}
								>
									{activeStep?.step_description}
								</Text>
								<Text
									color={getStateColor(Colors.DarkGray, isFetchEditsSuccess)}
								>
									Press{' '}
									<Text
										color={getStateColor(
											BaseColors.Gray500,
											isFetchEditsSuccess,
										)}
									>
										enter
									</Text>{' '}
									to generate the code changes for{' '}
									<Text
										color={getStateColor(
											BaseColors.Gray500,
											isFetchEditsSuccess,
										)}
										italic
									>
										{filepath}
									</Text>
									.
								</Text>
							</Box>
						</Box>

						{/* Preview changes */}
						{isFetchEditsSuccess && (
							<Box gap={1} flexShrink={0} marginTop={1}>
								<Text
									color={getStateColor(Colors.LightGreen, isApplyEditsSuccess)}
								>
									•
								</Text>
								<Box flexDirection="column" gap={1}>
									<Text
										color={getStateColor(Colors.LightGray, isApplyEditsSuccess)}
									>
										Scroll up or down to preview changes.
									</Text>
									<Text
										color={getStateColor(Colors.DarkGray, isApplyEditsSuccess)}
									>
										Press{' '}
										<Text
											color={getStateColor(
												Colors.LightGray,
												isApplyEditsSuccess,
											)}
										>
											enter
										</Text>{' '}
										to apply changes
									</Text>
								</Box>
							</Box>
						)}

						{/* Go to next step */}
						{isApplyEditsSuccess && (
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
								{editedFileHighlightedCode ? (
									<Text>{editedFileHighlightedCode}</Text>
								) : (
									<Text color={Colors.DarkGray}>
										{originalFileFormattedCode}
									</Text>
								)}
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
