import React from 'react';
import {createActorContext} from '@xstate/react';
import {
	initialToolMachineContext,
	toolMachine,
} from '../machines/toolMachine.js';

export const ToolsContext = createActorContext(toolMachine);

interface Props {
	children: React.ReactNode;
	libraryCommand: string;
	libraryName: string;
}

export const ToolsProvider = ({
	children,
	libraryCommand,
	libraryName,
}: Props) => {
	return (
		<ToolsContext.Provider
			machine={toolMachine.withContext({
				...initialToolMachineContext,
				libraryCommand,
				libraryName,
			})}
		>
			{children}
		</ToolsContext.Provider>
	);
};
