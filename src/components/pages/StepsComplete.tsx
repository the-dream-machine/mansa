import React from 'react';
import {PageContainer} from '../PageContainer.js';
import {Header} from '../Header.js';
import {SectionContainer} from '../SectionContainer.js';
import {ScrollContainer} from '../ScrollContainer.js';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import {Colors} from '../../utils/Colors.js';
import {Footer} from '../Footer.js';
import {ModifyFileEvent} from '../../machines/modifyFileMachine.js';

export const StepsComplete = () => {
	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			exit();
		}
	});

	return (
		<PageContainer>
			<Header />
			<ScrollContainer>
				<SectionContainer>
					<Box paddingBottom={1} flexDirection="column" gap={2}>
						<Text color={Colors.White}>You're all set! 🎉 🎉 🎉</Text>
						<Text color={Colors.LightGray}>
							Press <Text color={Colors.LightGreen}>enter</Text> or{' '}
							<Text color={Colors.LightGreen}>esc</Text> to exit
						</Text>
					</Box>
				</SectionContainer>
			</ScrollContainer>
			<Spacer />
			<Footer enterLabel="exit" controls={['up', 'down', 'esc', 'enter']} />
		</PageContainer>
	);
};
