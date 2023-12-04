import React from 'react';

import {StepsContext} from './StepsProvider.js';
import {StepsState} from '../machines/stepsMachine.js';
import {StepType} from '../types/Step.js';
import {ExecuteCommandStep} from './pages/steps/ExecuteCommandStep.js';
import {CreateFileStep} from './pages/steps/CreateFileStep.js';

import {ModifyFileStep} from './pages/steps/ModifyFileStep.js';
import {PageContainer} from './PageContainer.js';
import {Header} from './Header.js';
import {Spinner} from '@inkjs/ui';

import {UserActionStep} from './pages/steps/UserActionStep.js';
import {Body} from './Body.js';
import {Box, Spacer, Text} from 'ink';
import {Colors} from '../utils/Colors.js';
import figureSet from 'figures';
import {Footer} from './Footer.js';

export const StepsHandler = () => {
	const [state, send] = StepsContext.useActor();
	// console.log('🌱 # steps state:', state.value);
	// console.log('🌱 # highlighted:', state.context.highlightedStepsSummary);
	const showStep =
		state.matches(StepsState.ACTIVE_STEP_IDLE) ||
		state.matches(StepsState.FETCHING_NEXT_STEP);

	const showLoader =
		state.matches(StepsState.GENERATING_STEPS_SUMMARY) ||
		state.matches(StepsState.REVIEW_STEPS_IDLE);

	if (!showStep) {
		return (
			<PageContainer>
				<Header />
				<Text>{state.value.toString()}</Text>
				<Body>
					{/* Steps summary generation state */}
					<Box gap={1}>
						{!state.context.isStepsSummaryLoading &&
							!state.context.isStepsSummarySuccess &&
							!state.context.isStepsSummaryError && <Text>•</Text>}
						{state.context.isStepsSummaryLoading && <Spinner />}
						{state.context.isStepsSummarySuccess && (
							<Text color={Colors.DarkGreen}>{figureSet.tick}</Text>
						)}
						<Text
							color={
								state.context.isStepsSummaryLoading
									? Colors.White
									: Colors.LightGray
							}
						>
							Reading documentation
						</Text>
					</Box>

					{/* Steps generation state */}
					<Box gap={1}>
						{!state.context.isStepsLoading &&
							!state.context.isStepsSuccess &&
							!state.context.isStepsError && <Text>•</Text>}
						{state.context.isStepsLoading && <Spinner />}
						{state.context.isStepsSuccess && (
							<Text color={Colors.DarkGreen}>{figureSet.tick}</Text>
						)}
						<Text
							color={
								state.context.isStepsLoading ? Colors.White : Colors.LightGray
							}
						>
							Planning
						</Text>
					</Box>

					<Box flexDirection="column" paddingLeft={3} gap={2}>
						{state.context.steps?.map((step, index) => (
							<Box key={index} flexDirection="column">
								<Text color={Colors.LightGray}>
									{index + 1}. {step.step_title}
								</Text>
								<Text color={Colors.DarkGray}>{step.step_description}</Text>
							</Box>
						))}
					</Box>
				</Body>
				<Spacer />
				<Footer controls={['esc', 'enter']} />
			</PageContainer>
		);
	}

	// if (state.matches(StepsState.REVIEW_STEPS_SUMMARY_IDLE)) {
	// 	return <SummarySteps />;
	// }

	const activeStepIndex = state.context.activeStepIndex;
	const activeStep = state.context.steps?.[activeStepIndex];
	const activeStepType = activeStep?.step_type;

	return (
		<>
			{activeStepType === StepType.RUN_BASH_COMMAND && <ExecuteCommandStep />}
			{activeStepType === StepType.CREATE_FILE && <CreateFileStep />}
			{activeStepType === StepType.MODIFY_FILE && <ModifyFileStep />}
			{activeStepType === StepType.USER_ACTION && <UserActionStep />}
		</>
	);
};
