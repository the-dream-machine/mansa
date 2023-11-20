import React from 'react';
import {StepsContext} from './StepsProvider.js';
import {StepsState} from '../machines/stepsMachine.js';
import {GlobalLoader} from './GlobalLoader.js';
import {StepType} from '../types/Step.js';
import {ExecuteCommandStep} from './pages/steps/ExecuteCommandStep.js';
import {CreateFileStep} from './pages/steps/CreateFileStep.js';

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
			{activeStepType === StepType.RUN_BASH_COMMAND && <ExecuteCommandStep />}
			{activeStepType === StepType.CREATE_FILE && <CreateFileStep />}
			{activeStepType === StepType.MODIFY_FILE && <ModifyFileStep />}
		</>
	);
};
