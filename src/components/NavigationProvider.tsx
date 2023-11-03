import React from 'react';
import {createActorContext} from '@xstate/react';
import {navigationMachine} from '../machines/navigationMachine.js';

export const NavigationContext = createActorContext(navigationMachine);

export const NavigationProvider = ({children}: {children: React.ReactNode}) => {
	return <NavigationContext.Provider>{children}</NavigationContext.Provider>;
};
