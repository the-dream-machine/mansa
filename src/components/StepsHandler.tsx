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

export const StepsHandler = () => {
	const [state] = StepsContext.useActor();
	const showLoader =
		state.matches(StepsState.GENERATE_STEPS) ||
		state.matches(StepsState.POLLING_GENERATE_STEPS_STATUS) ||
		state.matches(StepsState.FETCHING_ALL_STEPS) ||
		state.matches(StepsState.SPAWNING_ACTIVE_STEP_MACHINE);

	if (showLoader) {
		return (
			<PageContainer>
				<Header isLoading loadingMessage={'Generating steps'} />
				<Spinner type="dwarfFortress" />
			</PageContainer>
		);
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
