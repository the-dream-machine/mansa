import React from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';
import {PageContainer} from '../PageContainer.js';

import {NavigationContext} from '../NavigationProvider.js';
import {Colors} from '../../styles/Colors.js';
import {ScrollContainer} from '../ScrollContainer.js';
import {SectionContainer} from '../SectionContainer.js';
import {chatMachine} from '../../machines/chatMachine.js';
import {TextInput} from '@inkjs/ui';

export const Chat = () => {
	const [, navigate] = NavigationContext.useActor();
	const [state, send] = useMachine(chatMachine);

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
				title="mansa"
				titleBackgroundColor={Colors.DarkGreen}
				isLoading={isLoading}
				isSuccess={isSuccess}
				isError={isError}
				errorMessage={errorMessage}
			/>
			<ScrollContainer>
				<SectionContainer>
					{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
					{/* @ts-ignore */}
					<Text>{state.value}</Text>
					<Text color={Colors.White}>What is manjaro?</Text>

					<Box
						paddingLeft={2}
						paddingY={1}
						borderStyle="single"
						borderBottom={false}
						borderRight={false}
						borderTop={false}
					>
						<TextInput placeholder="Type something..." />
					</Box>
				</SectionContainer>
			</ScrollContainer>
			<Spacer />
			<Footer
				controls={['up', 'down', 'esc', 'enter']}
				enterLabel={'next step'}
			/>
		</PageContainer>
	);
};
