import React from 'react';
import figureSet from 'figures';
import {useActor} from '@xstate/react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';

import {StepsContext} from '../../StepsProvider.js';
import {BaseColors, Colors} from '../../../utils/Colors.js';
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
import {dimInactiveStep} from '../../../utils/dimInactiveState.js';

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
		executeCommandMachineState.context.highlightedBashCommand
			.split('\n') // Remove newlines
			.join('')
			.trim();

	const enterLabel = executeCommandMachineState.context.enterLabel;
	const highlightedCommandOutput =
		executeCommandMachineState.context.highlightedCommandOutput;
	const isLoading = executeCommandMachineState.context.isLoading;
	const isSuccess = executeCommandMachineState.context.isSuccess;
	const isError = executeCommandMachineState.context.isError;
	const loadingMessage = executeCommandMachineState.context.loadingMessage;
	const successMessage = executeCommandMachineState.context.successMessage;
	const errorMessage = executeCommandMachineState.context.errorMessage;

	const showLogsSection = isLoading || isSuccess || isError;
	// const showLogsSection = true;

	const getFirstStepStateColor = (color: Colors) =>
		dimInactiveStep({color, condition: showLogsSection});

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
			<Header />
			<SectionContainer>
				{/* Title */}
				<Text color={BaseColors.White}>
					{activeStep?.step_title}{' '}
					<Text color={Colors.DarkGray}>
						(Step {activeStepIndex + 1} of {totalSteps})
					</Text>
				</Text>

				{/* Description */}
				<Box gap={3}>
					<Text color={getFirstStepStateColor(Colors.LightGreen)}>•</Text>
					<Text color={getFirstStepStateColor(Colors.LightGray)}>
						{activeStep?.step_description}
					</Text>
				</Box>

				{/* Bash command */}
				<Box marginLeft={3}>
					<Box flexGrow={0} borderStyle="round" borderColor={Colors.DarkGray}>
						<Text>{highlightedBashCommand}</Text>
					</Box>
				</Box>

				{/* Press Enter */}
				<Box paddingLeft={3}>
					<Text color={getFirstStepStateColor(Colors.LightGray)}>
						Press{' '}
						<Text color={getFirstStepStateColor(Colors.LightGreen)}>enter</Text>{' '}
						to run the command.
					</Text>
				</Box>
			</SectionContainer>

			{/* Command preview block */}
			{showLogsSection && (
				<SectionContainer showDivider>
					{/* Loader */}
					<Box gap={2}>
						{isLoading ? <Spinner /> : <Text color={Colors.LightGreen}>•</Text>}
						<Text color={Colors.LightGray}>Running command</Text>
					</Box>

					{/* Command */}
					{highlightedCommandOutput && (
						<Box gap={1} flexDirection="column" marginLeft={3}>
							<Box gap={1}>
								<Text color={Colors.DarkGray}>{figureSet.triangleDown}</Text>
								<Text color={Colors.LightGray}>Logs</Text>
							</Box>
							<Box
								paddingLeft={2}
								flexGrow={0}
								borderStyle="single"
								borderColor={Colors.DarkGray}
								borderTop={false}
								borderRight={false}
								borderBottom={false}
							>
								<Text color={Colors.DarkGray}>{highlightedCommandOutput}</Text>
							</Box>

							{isSuccess && (
								<Box flexDirection="column" gap={2} paddingTop={2}>
									<Box gap={2}>
										<Text color={Colors.LightGreen}>🎉</Text>
										<Text>{successMessage}</Text>
									</Box>

									<Text color={Colors.LightGray}>
										Press <Text color={Colors.LightGreen}>enter</Text> to go to
										the next step.
									</Text>
								</Box>
							)}
						</Box>
					)}
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
