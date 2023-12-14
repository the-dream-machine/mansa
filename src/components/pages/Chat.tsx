import React, {useState} from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {useActor, useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {PageContainer} from '../PageContainer.js';

import {NavigationContext} from '../NavigationProvider.js';
import {Colors} from '../../styles/Colors.js';
import {ScrollContainer} from '../ScrollContainer.js';
import {SectionContainer} from '../SectionContainer.js';
import {chatMachine} from '../../machines/chatMachine.js';
import {Spinner, TextInput} from '@inkjs/ui';
import {Actor} from '../../types/Actor.js';
import {
	CreateFileMachineContext,
	CreateFileMachineEvent,
	CreateFileMachineState,
} from '../../machines/createFileMachine.js';
import {ChatEvent} from '../../types/ChatMachine.js';

interface Props {
	libraryName: string;
	commandName: string;
}

export const Chat = ({libraryName, commandName}: Props) => {
	const [state, send] = useMachine(chatMachine, {
		context: {libraryName, commandName},
	});
	const activeToolActor = state.context.activeToolActor;
	const [createFileMachineState, createFileMachineSend] = useActor(
		activeToolActor!,
	) as Actor<
		CreateFileMachineContext,
		CreateFileMachineEvent,
		CreateFileMachineState
	>;
	// console.log('🌱 # createFileMachineState:', createFileMachineState.context);

	const library = state.context.library;
	const messages = state.context.messages;
	const enterLabel = state.context.enterLabel;
	const enterDisabled = state.context.enterDisabled;
	const isLoading = state.context.isLoading;
	const isSuccess = state.context.isSuccess;
	const isError = state.context.isError;
	const errorMessage = state.context.errorMessage;

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send({type: ChatEvent.ENTER_KEY_PRESS});
		}
	});

	return (
		<PageContainer>
			<Header
				title={library?.name}
				backgroundColor={library?.backgroundColor}
				textColor={library?.textColor}
				isLoading={isLoading}
				isSuccess={isSuccess}
				isError={isError}
				errorMessage={errorMessage}
			/>
			{/* <ScrollContainer> */}
			{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
			{/* @ts-ignore */}
			<Text>PARENT: {state.value}</Text>
			{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
			{/* @ts-ignore */}
			<Text>CHILD: {createFileMachineState.value}</Text>

			<SectionContainer>
				<Box flexDirection="column" gap={2}>
					{messages.map(
						({id, message, isUser, isCreateFile, isTool, isAssistant}) => (
							<Box key={id}>
								{isCreateFile && (
									<Box>
										<Box
											flexGrow={0}
											borderStyle="round"
											borderColor={Colors.DarkGray}
										>
											<Text>{message}</Text>
										</Box>
									</Box>
								)}
								{isUser && (
									<Box
										paddingLeft={2}
										paddingY={1}
										borderColor={Colors.LightGray}
										borderStyle="single"
										borderBottom={false}
										borderRight={false}
										borderTop={false}
									>
										<Text color={Colors.LightGray}>{message}</Text>
									</Box>
								)}
								{isTool && (
									<Box gap={2}>
										{isLoading && <Spinner />}
										<Box
											flexGrow={0}
											borderStyle="round"
											borderColor={Colors.DarkGray}
										>
											<Text>{message}</Text>
										</Box>
									</Box>
								)}
								{isAssistant && <Text color={Colors.LightGray}>{message}</Text>}
							</Box>
						),
					)}

					{!enterDisabled && (
						<Box
							paddingLeft={2}
							paddingY={1}
							borderColor={enterDisabled ? Colors.DarkGray : Colors.White}
							borderStyle="single"
							borderBottom={false}
							borderRight={false}
							borderTop={false}
						>
							<TextInput
								isDisabled={enterDisabled}
								placeholder="Type something..."
								onSubmit={query => send({type: ChatEvent.SEND_QUERY, query})}
							/>
						</Box>
					)}
				</Box>
			</SectionContainer>

			{/* </ScrollContainer> */}
			<Spacer />
			<Footer
				controls={['up', 'down', 'esc', 'enter']}
				enterDisabled={enterDisabled}
				enterLabel={enterLabel}
			/>
		</PageContainer>
	);
};
