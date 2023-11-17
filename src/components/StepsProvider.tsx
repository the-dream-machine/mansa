import React from 'react';
import {createActorContext} from '@xstate/react';
import {stepsMachine} from '../machines/stepsMachine.js';

export const StepsContext = createActorContext(stepsMachine);

export const StepsProvider = ({children}: {children: React.ReactNode}) => {
	return <StepsContext.Provider>{children}</StepsContext.Provider>;
};
