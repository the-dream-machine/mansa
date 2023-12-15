import React from 'react';
import {Box, Spacer, Text} from 'ink';
import {useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {PageContainer} from '../PageContainer.js';

import {Colors} from '../../styles/Colors.js';
import {SectionContainer} from '../SectionContainer.js';
import {chatMachine} from '../../machines/chatMachine.js';
import {Spinner, TextInput} from '@inkjs/ui';
import {ChatEvent} from '../../types/ChatMachine.js';
import {CreateFileMessage} from '../messages/CreateFileMessage.js';
import {type ActorRef} from 'xstate';
import {type CreateFileMachineEvent} from '../../machines/createFileMachine.js';
import {GetRepositoryMessage} from '../messages/GetRepositoryMessage.js';
import {FindFileByPathMessage} from '../messages/FindFileByPathMessage.js';
import {ReadFileMessage} from '../messages/ReadFileMessage.js';

interface Props {
	libraryName: string;
	commandName: string;
}

export const Chat = ({libraryName, commandName}: Props) => {
	const [state, send] = useMachine(chatMachine, {
		context: {libraryName, commandName},
	});
	console.log('🌱 # state:', state.value);

	const activeToolActor = state.context.activeToolActor;
	const library = state.context.library;
	const messages = state.context.messages;
	const enterLabel = state.context.enterLabel;
	const enterDisabled = state.context.enterDisabled;
	const isLoading = state.context.isLoading;
	const isSuccess = state.context.isSuccess;
	const isError = state.context.isError;
	const errorMessage = state.context.errorMessage;

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
			{/* <Text>PARENT: {state.value}</Text> */}

			<SectionContainer>
				<Box flexDirection="column" gap={2}>
					{messages.map(message => {
						const {
							id,
							text,
							isUser,
							isGetRepositorySummary,
							isFindFileByPath,
							isReadFile,
							isCreateFile,
							isTool,
							isAssistant,
						} = message;
						return (
							<Box key={id}>
								{isGetRepositorySummary && (
									<GetRepositoryMessage message={message} />
								)}
								{isFindFileByPath && (
									<FindFileByPathMessage message={message} />
								)}
								{isReadFile && <ReadFileMessage message={message} />}
								{isCreateFile && (
									<CreateFileMessage
										message={message}
										actor={activeToolActor as ActorRef<CreateFileMachineEvent>}
									/>
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
										<Text color={Colors.LightGray}>{text}</Text>
									</Box>
								)}
								{isTool && (
									<Box>
										<Box
											gap={2}
											flexGrow={0}
											// borderStyle="round"
											// borderColor={Colors.DarkGray}
										>
											{isLoading && <Spinner />}
											<Text>{text}</Text>
										</Box>
									</Box>
								)}
								{isAssistant && <Text color={Colors.White}>{text}</Text>}
							</Box>
						);
					})}

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
