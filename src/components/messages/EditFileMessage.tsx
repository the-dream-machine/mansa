import {Box, Text, useApp, useInput} from 'ink';
import React from 'react';
import {type Message} from '../../types/Message.js';
import {Colors} from '../../styles/Colors.js';
import {type ActorRef} from 'xstate';
import {
	type EditFileMachineContext,
	type EditFileMachineState,
	type EditFileMachineEvent,
	EditFileEvent,
} from '../../machines/editFileMachine.js';
import {useActor} from '@xstate/react';
import {type Actor} from '../../types/Actor.js';
import {Spinner} from '@inkjs/ui';

interface Props {
	message: Message;
	actor: ActorRef<EditFileMachineEvent>;
}

export const EditFileMessage = ({message, actor}: Props) => {
	const [state, send] = useActor(actor) as Actor<
		EditFileMachineContext,
		EditFileMachineEvent,
		EditFileMachineState
	>;

	const filePath = state.context.filePath;
	const isLoading = state.context.isLoading;
	const isSuccess = state.context.isSuccess;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send({type: EditFileEvent.ENTER_KEY_PRESS});
		}
	});

	return (
		<Box flexDirection="column" gap={1}>
			{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
			{/* @ts-ignore */}
			<Text>{state.value}</Text>

			{/* Code Block */}
			<Box
				flexDirection="column"
				flexShrink={0}
				gap={1}
				paddingTop={1}
				paddingX={2}
				borderColor={Colors.DarkGray}
				borderStyle="round"
			>
				<Text>{message.text}</Text>
			</Box>

			{/* Press Enter Edit File */}
			{!isLoading && !isSuccess && (
				<Text color={Colors.LightGray}>
					Press <Text color={Colors.LightGreen}>enter</Text> to apply the
					changes to{' '}
					<Text color={Colors.White} italic>
						{filePath}
					</Text>
					.
				</Text>
			)}

			{/* Loader */}
			{isLoading && (
				<Box gap={2}>
					<Spinner />
					<Text color={Colors.LightGray}>
						Editing{' '}
						<Text color={Colors.White} italic>
							{filePath}
						</Text>
					</Text>
				</Box>
			)}

			{/* Success message */}
			{isSuccess && (
				<Box flexDirection="column" gap={1}>
					<Box gap={1}>
						<Text color={Colors.LightGreen}>•</Text>
						<Text color={Colors.LightGray}>
							Successfully edited{' '}
							<Text color={Colors.White} italic>
								{filePath}
							</Text>
						</Text>
					</Box>

					<Box marginLeft={2}>
						<Text color={Colors.LightGray}>
							Press <Text color={Colors.LightGreen}>enter</Text> to go to the
							next step.
						</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
};
