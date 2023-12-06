import React from 'react';

import {StepsContext} from './StepsProvider.js';
import {StepsState} from '../machines/stepsMachine.js';
import {StepType} from '../types/Step.js';
import {ExecuteCommandStep} from './pages/steps/ExecuteCommandStep.js';
import {CreateFileStep} from './pages/steps/CreateFileStep.js';
import {ModifyFileStep} from './pages/steps/ModifyFileStep.js';
import {UserActionStep} from './pages/steps/UserActionStep.js';
import {GenerateSteps} from './pages/GenerateSteps.js';

export const StepsHandler = () => {
	const [state] = StepsContext.useActor();

	const showStepsScreen =
		state.matches(StepsState.GENERATING_STEPS_SUMMARY) ||
		state.matches(StepsState.PERSONALIZING_STEPS_SUMMARY) ||
		state.matches(StepsState.GENERATING_STEPS) ||
		state.matches(StepsState.REVIEW_STEPS_IDLE);

	const activeStepIndex = state.context.activeStepIndex;
	const activeStep = state.context.steps?.[activeStepIndex];
	const activeStepType = activeStep?.step_type;

	if (showStepsScreen) {
		return <GenerateSteps />;
	}

	return (
		<>
			{activeStepType === StepType.RUN_BASH_COMMAND && <ExecuteCommandStep />}
			{activeStepType === StepType.CREATE_FILE && <CreateFileStep />}
			{activeStepType === StepType.MODIFY_FILE && <ModifyFileStep />}
			{activeStepType === StepType.USER_ACTION && <UserActionStep />}
		</>
	);
};
