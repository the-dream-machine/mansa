import React, {useState} from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {PageContainer} from '../PageContainer.js';

import {NavigationContext} from '../NavigationProvider.js';
import {Colors} from '../../styles/Colors.js';
import {ScrollContainer} from '../ScrollContainer.js';
import {SectionContainer} from '../SectionContainer.js';
import {ChatEvent, chatMachine} from '../../machines/chatMachine.js';
import {TextInput} from '@inkjs/ui';

interface Props {
	name: string;
}

export const Chat = ({name}: Props) => {
	const [value, setValue] = useState('');
	const [, navigate] = NavigationContext.useActor();
	const [state, send] = useMachine(chatMachine, {
		context: {libraryName: name},
	});

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
			{/* <Text>{state.value}</Text> */}

			<SectionContainer>
				<Box flexDirection="column" gap={2}>
					{messages.map(
						(
							{id, message, isRetrievalRun, isUser, isTool, isAssistant},
							index,
						) => (
							<Box key={id}>
								{isRetrievalRun && (
									<Text color={Colors.White}>Documentation:</Text>
								)}
								{isUser && (
									<Box
										paddingLeft={2}
										paddingY={1}
										borderColor={Colors.DarkGray}
										borderStyle="single"
										borderBottom={false}
										borderRight={false}
										borderTop={false}
									>
										<Text color={Colors.LightGray}>{message}</Text>
									</Box>
								)}
								{isTool && (
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
								{isAssistant && <Text color={Colors.LightGray}>{message}</Text>}
							</Box>
						),
					)}
				</Box>
			</SectionContainer>

			{!enterDisabled && (
				<SectionContainer showDivider={messages.length > 0}>
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
							onChange={setValue}
							onSubmit={query => send({type: ChatEvent.SEND_QUERY, query})}
						/>
					</Box>
				</SectionContainer>
			)}
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
