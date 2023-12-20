import React from 'react';
import {Spinner} from '@inkjs/ui';
import {useActor} from '@xstate/react';
import {Box, Text, useApp, useInput} from 'ink';

import {ToolsContext} from '../ToolsProvider.js';
import {
	SendCommandEvent,
	type SendCommandMachineContext,
	type SendCommandMachineEvent,
	type SendCommandMachineState,
} from '../../machines/sendCommandMachine.js';
import {Colors} from '../../styles/Colors.js';
import {type MachineActor} from '../../types/MachineActor.js';
import {SectionContainer} from '../SectionContainer.js';

export const SendCommand = () => {
	const [toolMachineState] = ToolsContext.useActor();
	const sendCommandActorRef = toolMachineState?.context.sendCommandActorRef;

	const [state, send] = useActor(sendCommandActorRef!) as MachineActor<
		SendCommandMachineContext,
		SendCommandMachineEvent,
		SendCommandMachineState
	>;

	const isMachineActive = !state.done;
	const statusLabel = state.context.statusLabel;
	const enterLabel = state.context.enterLabel;
	const isLoading = state.context.isLoading;
	const isSuccess = state.context.isSuccess;
	const isError = state.context.isError;
	const errorMessage = state.context.errorMessage;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape && isMachineActive) {
			exit();
		}
		if (key.return && isMachineActive) {
			send({type: SendCommandEvent.ENTER_KEY_PRESSED});
		}
	});

	return (
		<SectionContainer>
			<Box flexDirection="column">
				<Box>
					<Box
						gap={1}
						paddingX={1}
						flexGrow={0}
						borderStyle="round"
						borderColor={Colors.DarkGray}
					>
						{isLoading && <Spinner />}
						{isSuccess && <Text color={Colors.LightGreen}>•</Text>}
						{isError && <Text color={Colors.LightRed}>•</Text>}
						<Text>{statusLabel}</Text>
					</Box>
				</Box>

				<Box marginLeft={1}>
					{isError && (
						<Text color={Colors.LightGray}>Error: {errorMessage}</Text>
					)}
				</Box>
			</Box>

			{isMachineActive && (
				<>
					{(isSuccess || isError) && (
						<Box marginLeft={1}>
							<Text color={Colors.LightGray}>
								Press <Text color={Colors.White}>enter</Text> to {enterLabel}
							</Text>
						</Box>
					)}
				</>
			)}
		</SectionContainer>
	);
};
