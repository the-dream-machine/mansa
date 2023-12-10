import React from 'react';
import {PageContainer} from '../PageContainer.js';
import {Spinner} from '@inkjs/ui';
import {Box, Text, Spacer, useApp, useInput} from 'ink';
import {Colors} from '../../styles/Colors.js';
import {Footer, type FooterControl} from '../Footer.js';
import {Header} from '../Header.js';
import {SectionContainer} from '../SectionContainer.js';
import {StepsContext} from '../StepsProvider.js';
import {StepsEvent} from '../../types/StepsMachine.js';
import {ScrollContainer} from '../ScrollContainer.js';

export const GenerateSteps = () => {
	const [state, send] = StepsContext.useActor();

	const showStepsSummary =
		state.context.isStepsSummaryLoading ||
		state.context.isStepsSummarySuccess ||
		state.context.isStepsSummaryError;

	const showPersonalizingSteps =
		state.context.isPersonalizingStepsLoading ||
		state.context.isPersonalizingStepsSuccess ||
		state.context.isPersonalizingStepsError;

	const showGeneratingSteps =
		state.context.isGeneratingStepsLoading ||
		state.context.isGeneratingStepsSuccess ||
		state.context.isGeneratingStepsError;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send(StepsEvent.ENTER_KEY_PRESS);
		}
	});

	return (
		<PageContainer>
			<Header />
			<ScrollContainer>
				<Box
					flexDirection="column"
					paddingX={3}
					paddingY={2}
					gap={1}
					marginTop={1}
				>
					{/* Steps summary */}
					{showStepsSummary && (
						<Box gap={2} flexShrink={0}>
							{/* Loader */}
							{state.context.isStepsSummaryLoading && <Spinner />}

							{/* Success */}
							{state.context.isStepsSummarySuccess && (
								<Text color={Colors.LightGreen}>•</Text>
							)}

							{/* Text */}
							<Text color={Colors.White}>Reading documentation</Text>
						</Box>
					)}

					{/* Personalizing steps */}
					{showPersonalizingSteps && (
						<Box gap={2} flexShrink={0}>
							{/* Loader */}
							{state.context.isPersonalizingStepsLoading && <Spinner />}

							{/* Success */}
							{state.context.isPersonalizingStepsSuccess && (
								<Text color={Colors.LightGreen}>•</Text>
							)}

							{/* Text */}
							<Text color={Colors.White}>Analyzing code</Text>
						</Box>
					)}

					{/* Generating steps */}
					{showGeneratingSteps && (
						<Box flexDirection="column" gap={1}>
							<Box gap={2} flexShrink={0}>
								{/* Loader */}
								{state.context.isGeneratingStepsLoading && <Spinner />}

								{/* Success */}
								{state.context.isGeneratingStepsSuccess && (
									<Text color={Colors.LightGreen}>•</Text>
								)}

								{/* Text */}
								<Text color={Colors.White}>Planning</Text>
							</Box>

							{state.context.isGeneratingStepsSuccess && (
								<Box paddingX={3} flexDirection="column" gap={2}>
									<Box
										flexDirection="column"
										paddingX={2}
										paddingY={1}
										gap={1}
										width="100%"
										borderStyle="round"
										borderColor={Colors.DarkGray}
									>
										<Text>Steps</Text>
										{/* Steps */}
										{state.context.steps?.map((step, index) => (
											<Box key={index} flexDirection="column">
												<Text color={Colors.LightGray}>
													{index + 1}. {step.step_title}
												</Text>
											</Box>
										))}
									</Box>
									{/* Press Enter */}
									<Text color={Colors.LightGray}>
										Press <Text color={Colors.LightGreen}>enter</Text> to start
										the walkthrough.
									</Text>
								</Box>
							)}
						</Box>
					)}
				</Box>
			</ScrollContainer>
			{state.context.isGeneratingStepsSuccess && (
				<>
					{/* <Spacer /> */}
					<Footer
						controls={['up', 'down', 'esc', 'enter']}
						enterLabel={'start walkthrough'}
					/>
				</>
			)}
		</PageContainer>
	);
};
