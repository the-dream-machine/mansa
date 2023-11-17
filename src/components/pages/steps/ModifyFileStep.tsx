import React from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {useActor} from '@xstate/react';
import {StepsContext} from '../../StepsProvider.js';
import {Spinner} from '@inkjs/ui';
import {BaseColors} from '../../Colors.js';
import {PageContainer} from '../../PageContainer.js';
import {ScrollContainer} from '../../ScrollContainer.js';
import {Footer} from '../../Footer.js';
import {highlight, highlightFile, highlightFileSync} from 'prismjs-terminal';
import loadLanguages from 'prismjs/components/index.js';

import figureSet from 'figures';
import {StepsEvent, StepsState} from '../../../machines/stepsMachine.js';
import {Header} from '../../Header.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
loadLanguages(['bash']);

export const ModifyFileStep = () => {
	const [state, send] = StepsContext.useActor();
	const activeStepIndex = state.context.activeStepIndex;
	const activeStep = state.context.steps?.[activeStepIndex];
	const totalSteps = state.context.steps?.length;
	const fileToModify = highlightFileSync(
		activeStep?.new_file_path_to_create?.file_path ?? '',
	);

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send(StepsEvent.ENTER_PRESSED);
		}
	});

	return (
		<PageContainer>
			<Header />
			<ScrollContainer>
				<Box flexDirection="row" gap={1}>
					<Box flexDirection="column" gap={1}>
						<Text color={BaseColors.White}>
							{activeStep?.step_title}
							<Text color={BaseColors.Gray200}>
								{' '}
								(Step {activeStepIndex + 1} of {totalSteps})
							</Text>
						</Text>
						<Text color={BaseColors.Gray600}>
							{activeStep?.step_description}
						</Text>
					</Box>
					<Box flexDirection="column" gap={1}>
						<Text color={BaseColors.Gray700} italic>
							<Text color={BaseColors.Green500}>•</Text> New file:{' '}
							{activeStep?.new_file_path_to_create?.file_path}
						</Text>
						<Text>{fileToModify}</Text>
					</Box>
				</Box>
			</ScrollContainer>
			<Footer controls={['enter', 'esc']} enterLabel="apply" />
		</PageContainer>
	);
};
