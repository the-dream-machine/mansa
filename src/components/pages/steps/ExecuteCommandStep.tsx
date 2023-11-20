import React, {useState} from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';

import {StepsContext} from '../../StepsProvider.js';
import {BaseColors, Colors} from '../../Colors.js';
import {PageContainer} from '../../PageContainer.js';
import {ScrollContainer} from '../../ScrollContainer.js';
import {Footer} from '../../Footer.js';
import {highlight} from 'prismjs-terminal';
import loadLanguages from 'prismjs/components/index.js';
import {StepsEvent, StepsState} from '../../../machines/stepsMachine.js';
import {Header} from '../../Header.js';
import {defaultTheme} from '../../../utils/prismThemes.js';
import figureSet from 'figures';
import {$} from 'zx';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call

loadLanguages('bash');

export const ExecuteCommandStep = () => {
	const [output, setOutput] = useState('');
	const [showOutput, setShowOutput] = useState(false);
	const [state, send] = StepsContext.useActor();
	const activeStepIndex = state.context.activeStepIndex;
	const activeStep = state.context.steps?.[activeStepIndex];
	const bashCommand = activeStep?.bash_command_to_run ?? '';
	const highlightedBashCommand = highlight(bashCommand, {
		language: 'bash',
		theme: defaultTheme,
	});
	const totalSteps = state.context.steps?.length;
	const isLoading = state.matches(StepsState.ACTIVE_STEP_RUNNING);
	const isSuccess = state.matches(StepsState.ACTIVE_STEP_SUCCESS_IDLE);
	const isError = state.matches(StepsState.ACTIVE_STEP_ERROR_IDLE);
	const getStateColor = (color: Colors) =>
		isSuccess ? Colors.DarkGray : color;
	const getEnterLabel = () => {
		if (isSuccess) {
			return 'next step';
		} else if (isError) {
			return 'retry';
		} else {
			return 'run command';
		}
	};

	const {exit} = useApp();
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	useInput(async (_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send(StepsEvent.ENTER_PRESSED);
			const process =
				await $`bun add @trigger.dev/sdk @trigger.dev/nextjs`.quiet();
			for await (const chunk of process.stdout) {
				setOutput(currentOutput => currentOutput.concat(chunk));
			}
			setShowOutput(true);
		}
	});

	return (
		<PageContainer>
			<Header
				isLoading={isLoading}
				isSuccess={isSuccess}
				loadingMessage="Running command"
				successMessage="Run successfully"
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
						{showOutput && (
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
										<Text color={Colors.DarkGray}>{output}</Text>
									</Box>
									<Text color={Colors.DarkGray}>{figureSet.triangleUp}</Text>
								</Box>
							</ScrollContainer>
						)}
					</Box>
				</Box>
			</Box>
			<Spacer />
			<Footer
				controls={['enter', 'esc', 'up', 'down']}
				enterLabel={getEnterLabel()}
				enterDisabled={isLoading}
			/>
		</PageContainer>
	);
};
