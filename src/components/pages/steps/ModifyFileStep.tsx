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
import {SectionContainer} from '../../SectionContainer.js';
import {Spinner} from '@inkjs/ui';
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

	const filepath = modifyFileMachineContext.originalFilePath;
	const editedFileHighlightedCode =
		modifyFileMachineContext.editedFileHighlightedCode;
	const enterLabel = modifyFileMachineContext.enterLabel;

	const isFetchEditsLoading = modifyFileMachineContext.isFetchEditsLoading;
	const isFetchEditsSuccess = modifyFileMachineContext.isFetchEditsSuccess;
	const isFetchEditsError = modifyFileMachineContext.isFetchEditsError;
	const isApplyEditsLoading = modifyFileMachineContext.isApplyEditsLoading;
	const isApplyEditsSuccess = modifyFileMachineContext.isApplyEditsSuccess;
	const isApplyEditsError = modifyFileMachineContext.isApplyEditsError;
	const errorMessage = modifyFileMachineContext.errorMessage;

	const showFetchEditsSection =
		isFetchEditsLoading || isFetchEditsSuccess || isFetchEditsError;
	const showApplyEditsSection =
		isApplyEditsLoading || isApplyEditsSuccess || isApplyEditsError;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			modifyFileMachineSend(ModifyFileEvent.ENTER_KEY_PRESSED);
		}
	});

	const getFetchEditsStateColor = (color: Colors) =>
		showFetchEditsSection ? Colors.DarkGray : color;

	const getApplyStateColor = (color: Colors) =>
		showApplyEditsSection ? Colors.DarkGray : color;

	return (
		<PageContainer>
			<Header />
			<ScrollContainer>
				<SectionContainer>
					{/* Title */}
					<Box paddingBottom={1}>
						<Text color={BaseColors.White}>
							{activeStep?.step_title}{' '}
							<Text color={Colors.DarkGray}>
								(Step {activeStepIndex + 1} of {totalSteps})
							</Text>
						</Text>
					</Box>

					{/* Description step */}
					<Text color={getFetchEditsStateColor(Colors.LightGray)}>
						{activeStep?.step_description}
					</Text>

					{/* Press Enter Edit File */}
					<Box>
						<Text color={getFetchEditsStateColor(Colors.LightGray)}>
							Press{' '}
							<Text color={getFetchEditsStateColor(Colors.LightGreen)}>
								enter
							</Text>{' '}
							to preview changes for{' '}
							<Text color={getFetchEditsStateColor(Colors.White)} italic>
								{filepath}
							</Text>
						</Text>
					</Box>
				</SectionContainer>

				{showFetchEditsSection && (
					<SectionContainer showDivider>
						<Box flexDirection="column" gap={1}>
							{/* Loader */}
							{isFetchEditsLoading && (
								<Box gap={1}>
									<Spinner />
									<Text color={getApplyStateColor(Colors.LightGray)}>
										Fetching changes for{' '}
										<Text color={getApplyStateColor(Colors.White)} italic>
											{filepath}
										</Text>
									</Text>
								</Box>
							)}
							{isFetchEditsSuccess && (
								<Box gap={1}>
									<Text color={getApplyStateColor(Colors.LightGreen)}>•</Text>
									<Text color={getApplyStateColor(Colors.LightGray)}>
										Successfully fetched changes for{' '}
										<Text color={getApplyStateColor(Colors.White)} italic>
											{filepath}
										</Text>
									</Text>
								</Box>
							)}
						</Box>

						{/* Code block */}
						{editedFileHighlightedCode && (
							<Box>
								<Box
									flexDirection="column"
									gap={1}
									marginX={2}
									paddingX={2}
									paddingY={1}
									borderColor={Colors.DarkGray}
									borderStyle="round"
									width="100%"
								>
									<Text color={Colors.DarkGray} italic>
										{filepath}
									</Text>
									<Text>{editedFileHighlightedCode}</Text>
								</Box>
							</Box>
						)}

						{/* Press Enter Apply Changes */}
						{isFetchEditsSuccess && (
							<Box marginLeft={2} paddingTop={1}>
								<Text color={getApplyStateColor(Colors.LightGray)}>
									Press{' '}
									<Text color={getApplyStateColor(Colors.LightGreen)}>
										enter
									</Text>{' '}
									to apply these changes to{' '}
									<Text color={getApplyStateColor(Colors.White)} italic>
										{filepath}
									</Text>
								</Text>
							</Box>
						)}
					</SectionContainer>
				)}

				{showApplyEditsSection && (
					<SectionContainer showDivider>
						<Box flexDirection="column" gap={1}>
							{/* Loading */}
							{isApplyEditsLoading && (
								<Box gap={1} paddingX={2}>
									<Spinner />
									<Text color={Colors.LightGray}>
										Applying changes to{' '}
										<Text color={Colors.White} italic>
											{filepath}
										</Text>
									</Text>
								</Box>
							)}

							{/* Success */}
							{isApplyEditsSuccess && (
								<Box flexDirection="column" gap={2}>
									<Box gap={1}>
										<Text color={Colors.LightGreen}>•</Text>
										<Text color={Colors.LightGray}>
											Successfully applied changes to{' '}
											<Text color={Colors.White} italic>
												{filepath}
											</Text>
										</Text>
									</Box>
									<Box marginLeft={2}>
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
				controls={['up', 'down', 'esc', 'enter']}
				enterLabel={enterLabel}
				enterDisabled={isFetchEditsLoading || isApplyEditsLoading}
			/>
		</PageContainer>
	);
};
