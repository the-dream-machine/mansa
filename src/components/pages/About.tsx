import React from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {useMachine} from '@xstate/react';

import {Header} from '../Header.js';
import {Footer} from '../Footer.js';

import {PageContainer} from '../PageContainer.js';
import {
	IndexRepositoryEvent,
	indexRepositoryMachine,
} from '../../machines/indexRepositoryMachine.js';
import {NavigationContext} from '../NavigationProvider.js';
import {BaseColors, Colors} from '../../styles/Colors.js';
import {ScrollContainer} from '../ScrollContainer.js';
import {SectionContainer} from '../SectionContainer.js';

export const About = () => {
	const [, navigate] = NavigationContext.useActor();
	const [_, send] = useMachine(indexRepositoryMachine, {
		context: {navigate},
	});

	// const {exit} = useApp();
	// useInput((_, key) => {
	// 	if (key.escape) {
	// 		exit();
	// 	}
	// 	if (key.return) {
	// 		send(IndexRepositoryEvent.ENTER_KEY_PRESS);
	// 	}
	// });

	return (
		<PageContainer>
			<Header title="mansa" backgroundColor={BaseColors.Pink500} />
			<ScrollContainer>
				<SectionContainer>
					<Text>What is mansa?</Text>
					<Text color={'gray'}>
						mansa uses your <Text color="white">.gitignore</Text> file to figure
						out which files and folders should be ignored when parsing and
						indexing your code. Also, mansa ignores file formats whose content
						can't be parsed like image, video and audio files.
					</Text>

					<Box flexDirection="column" gap={2}>
						<Box flexDirection="column" gap={1} marginTop={2}>
							<Text color="white">🧠 Full codebase knowledge</Text>
							<Text color="gray">
								To generate accurate API guides, mansa maintains an index of the
								files in your project. This index is updated when the content of
								your files change.
							</Text>
						</Box>
						<Box flexDirection="column" gap={1}>
							<Text color="white">🧩 API expert</Text>
							<Text color="gray">
								mansa finds the most relevant documentation and
							</Text>
						</Box>
						<Box flexDirection="column" gap={1}>
							<Text color="white">👀 Privacy</Text>
							<Text color="gray">
								All your files remain on your device, they are never stored on
								mansa's servers. While editing files, code snippets will be sent
								to our server for processing.
							</Text>
						</Box>
						<Box flexDirection="column" gap={1}>
							<Text color="white">
								Safety{' '}
								<Text color={Colors.LightGray}>- You're always in control</Text>
							</Text>
							<Text color="gray">
								mansa can create files, edit files and run commands. It cannot
								delete files. You will always be prompted for confirmation
								before any actions are taken.
							</Text>
						</Box>
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
