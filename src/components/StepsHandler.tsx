import React from 'react';
import {StepsContext} from './StepsProvider.js';
import {StepsState} from '../machines/stepsMachine.js';
import {GlobalLoader} from './GlobalLoader.js';
import {StepType} from '../types/Step.js';
import {ExecuteCommandStep} from './pages/steps/ExecuteCommandStep.js';
import {CreateFileStep} from './pages/steps/CreateFileStep.js';

import {Box, Text} from 'ink';
import {ModifyFileStep} from './pages/steps/ModifyFileStep.js';

export const StepsHandler = () => {
	const [state] = StepsContext.useActor();
	const showLoader = state.matches(StepsState.GENERATING_STEPS);

	if (showLoader) {
		return <GlobalLoader />;
	}

	const activeStepIndex = state.context.activeStepIndex;
	const activeStep = state.context.steps?.[activeStepIndex];
	const activeStepType = activeStep?.step_type;

	return (
		<>
			{/* <Box flexDirection="column" paddingTop={2} gap={1}>
				{state.matches(StepsState.ACTIVE_STEP_IDLE) && (
					<Text>⋯ State: Active Step Idle</Text>
				)}
				{state.matches(StepsState.ACTIVE_STEP_RUNNING) && (
					<Text>⏳ State: Active Step Running</Text>
				)}
				{state.matches(StepsState.ACTIVE_STEP_SUCCESS_IDLE) && (
					<Text>🎉 State: Active Step Success Idle</Text>
				)}
				<Text>Title: {activeStep?.step_title}</Text>
				<Text>Type: {activeStep?.step_type}</Text>
				<Text>Index: {activeStepIndex}</Text>
			</Box> */}
			{activeStepType === StepType.RUN_BASH_COMMAND && <ExecuteCommandStep />}
			{activeStepType === StepType.CREATE_FILE && <CreateFileStep />}
			{activeStepType === StepType.MODIFY_FILE && <ModifyFileStep />}
		</>
	);
};
