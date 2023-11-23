import React from 'react';
import figureSet from 'figures';
import {useActor} from '@xstate/react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';

import {StepsContext} from '../../StepsProvider.js';
import {BaseColors, Colors} from '../../Colors.js';
import {PageContainer} from '../../PageContainer.js';
import {ScrollContainer} from '../../ScrollContainer.js';
import {Footer} from '../../Footer.js';
import loadLanguages from 'prismjs/components/index.js';
import {Header} from '../../Header.js';
import {
	ExecuteCommandEvent,
	type ExecuteCommandMachineContext,
	type ExecuteCommandMachineEvent,
	type ExecuteCommandMachineState,
} from '../../../machines/executeCommandMachine.js';
import {type Actor} from '../../../types/Actor.js';

loadLanguages('bash');

export const ExecuteCommandStep = () => {
	const [stepsState] = StepsContext.useActor();
	const activeStepIndex = stepsState.context.activeStepIndex;
	const activeStep = stepsState.context.steps?.[activeStepIndex];
	const activeStepActor = stepsState.context.activeStepActor;
	const totalSteps = stepsState.context.steps?.length;

	const [executeCommandMachineState, executeCommandMachineSend] = useActor(
		activeStepActor!,
	) as Actor<
		ExecuteCommandMachineContext,
		ExecuteCommandMachineEvent,
		ExecuteCommandMachineState
	>;
	const highlightedBashCommand =
		executeCommandMachineState.context.highlightedBashCommand;
	const enterLabel = executeCommandMachineState.context.enterLabel;
	const highlightedCommandOutput =
		executeCommandMachineState.context.highlightedCommandOutput;
	const isLoading = executeCommandMachineState.context.isLoading;
	const isSuccess = executeCommandMachineState.context.isSuccess;
	const isError = executeCommandMachineState.context.isError;
	const loadingMessage = executeCommandMachineState.context.loadingMessage;
	const successMessage = executeCommandMachineState.context.successMessage;
	const errorMessage = executeCommandMachineState.context.errorMessage;

	const getStateColor = (color: Colors) =>
		isSuccess ? Colors.DarkGray : color;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			executeCommandMachineSend(ExecuteCommandEvent.ENTER_KEY_PRESSED);
		}
	});

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
				<Box gap={4}>
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
									<Text color={getStateColor(Colors.LightGray)}>enter</Text> to
									run the command.
								</Text>
							</Box>
						</Box>

						{/* Success step */}
						{isSuccess && (
							<Box gap={1} flexShrink={1} marginTop={1}>
								<Text color={Colors.LightGreen}>•</Text>
								<Text color={Colors.LightGray}>
									Press <Text color={Colors.White}>enter</Text> to go to the
									next step.
								</Text>
							</Box>
						)}
					</Box>

					{/* Command block */}
					<Box
						minWidth={50}
						width={'45%'}
						flexDirection="column"
						flexShrink={0}
						gap={1}
						marginTop={2}
						paddingTop={2}
						paddingBottom={1}
						paddingX={2}
						borderColor={Colors.DarkGray}
						borderStyle="round"
					>
						<Text>{highlightedBashCommand}</Text>
						{highlightedCommandOutput && (
							<ScrollContainer>
								<Box gap={1} flexDirection="column">
									<Box gap={1}>
										<Text color={Colors.DarkGray}>
											{figureSet.triangleDown}
										</Text>
										<Text color={Colors.LightGray}>Logs</Text>
									</Box>
									<Box
										paddingBottom={12}
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
							</ScrollContainer>
						)}
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
