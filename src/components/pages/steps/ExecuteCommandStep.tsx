import React from 'react';
import figureSet from 'figures';
import {useActor} from '@xstate/react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';

import {StepsContext} from '../../StepsProvider.js';
import {Colors} from '../../../utils/Colors.js';
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
import {Spinner} from '@inkjs/ui';
import {SectionContainer} from '../../SectionContainer.js';
import {StepsEvent} from '../../../types/StepsMachine.js';

loadLanguages('bash');

export const ExecuteCommandStep = () => {
	const [stepsState, stepsSend] = StepsContext.useActor();
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

	const enterLabel = executeCommandMachineState.context.enterLabel;
	const highlightedCommandOutput =
		executeCommandMachineState.context.highlightedCommandOutput;
	const isLoading = executeCommandMachineState.context.isLoading;
	const isSuccess = executeCommandMachineState.context.isSuccess;
	const isError = executeCommandMachineState.context.isError;
	const errorMessage = executeCommandMachineState.context.errorMessage;
	const showLogsSection = executeCommandMachineState.context.showLogsSection;
	const highlightedBashCommand =
		executeCommandMachineState.context.highlightedBashCommand
			.split('\n') // Remove newlines
			.join('')
			.trim();

	const getStateColor = (color: Colors) =>
		showLogsSection ? Colors.DarkGray : color;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			executeCommandMachineSend(ExecuteCommandEvent.ENTER_KEY_PRESSED);
		}
		// if (key.tab) {
		// 	stepsSend(StepsEvent.NAVIGATE_NEXT_STEP);
		// }
		if (key.shift && key.tab) {
			stepsSend(StepsEvent.NAVIGATE_NEXT_STEP);
		}
	});

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

					{/* Bash command */}
					<Box>
						<Box flexGrow={0} borderStyle="round" borderColor={Colors.DarkGray}>
							<Text>{highlightedBashCommand}</Text>
						</Box>
					</Box>

					{/* Press Enter */}
					<Text color={getStateColor(Colors.LightGray)}>
						Press <Text color={getStateColor(Colors.LightGreen)}>enter</Text> to
						run the command.
					</Text>
				</SectionContainer>

				{/* Command preview block */}
				{showLogsSection && (
					<SectionContainer showDivider>
						{/* Loader */}
						{isLoading && (
							<Box gap={1}>
								<Spinner />
								<Text color={Colors.LightGray}>Running command</Text>
							</Box>
						)}
						{isSuccess && (
							<Box gap={1}>
								<Text color={Colors.LightGreen}>•</Text>
								<Text color={Colors.LightGray}>Run successful</Text>
							</Box>
						)}
						{isError && (
							<Box gap={1}>
								<Text color={Colors.LightRed}>•</Text>
								<Text color={Colors.LightGray}>
									Error running command: {errorMessage}
								</Text>
							</Box>
						)}

						{/* Command */}
						{highlightedCommandOutput && (
							<Box gap={1} flexDirection="column" marginLeft={1}>
								<Box gap={1}>
									<Text color={Colors.DarkGray}>{figureSet.triangleDown}</Text>
									<Text color={Colors.LightGray}>Logs</Text>
								</Box>
								<Box
									paddingLeft={2}
									marginBottom={1}
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

								{/* Press Enter */}
								{isSuccess && (
									<Text color={Colors.LightGray}>
										Press <Text color={Colors.LightGreen}>enter</Text> to go to
										the next step.
									</Text>
								)}
								{isError && (
									<Text color={Colors.LightGray}>
										Press <Text color={Colors.LightGreen}>enter</Text> to retry.
									</Text>
								)}
							</Box>
						)}
					</SectionContainer>
				)}
			</ScrollContainer>
			<Spacer />
			<Footer
				controls={['up', 'down', 'enter', 'esc', 'tab']}
				enterLabel={enterLabel}
				enterDisabled={isLoading}
			/>
		</PageContainer>
	);
};
