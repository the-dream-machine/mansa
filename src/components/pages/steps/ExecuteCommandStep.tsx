import React, {useState} from 'react';
import {Spinner} from '@inkjs/ui';
import {useApp, useInput, Text, Box} from 'ink';
// import highlight from 'prism-cli';
import {highlight} from 'prismjs-terminal';

import {$, sleep} from 'zx';

import {Footer} from '../../Footer.js';
import {BaseColors, Colors} from '../../Colors.js';
import {ScrollContainer} from '../../ScrollContainer.js';
import figureSet from 'figures';
import loadLanguages from 'prismjs/components/index.js';
import {StepsContext} from '../../StepsProvider.js';
import {Header} from '../../Header.js';
import {PageContainer} from '../../PageContainer.js';
import {StepsEvent, StepsState} from '../../../machines/stepsMachine.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
loadLanguages(['bash']);

export const ExecuteCommandStep = () => {
	const [state, send] = StepsContext.useActor();
	const [output, setOutput] = useState('');

	const activeStepIndex = state.context.activeStepIndex;
	const activeStep = state.context.steps?.[activeStepIndex];
	const isLoading = state.matches(StepsState.ACTIVE_STEP_RUNNING);
	const isSuccess = state.matches(StepsState.ACTIVE_STEP_SUCCESS_IDLE);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	const highlightedBashCommand = highlight(
		activeStep?.bash_command_to_run?.trim() ?? '',
		{language: 'bash'},
	);

	const {exit} = useApp();
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			send(StepsEvent.ENTER_PRESSED);
			// setIsLoading(true);
			// try {
			// 	await sleep(4000);
			// 	const process =
			// 		await $`bun add @trigger.dev/sdk @trigger.dev/nextjs`.quiet();
			// 	for (const chunk of process.stdout) {
			// 		setOutput(currentOutput => currentOutput.concat(chunk));
			// 	}
			// 	setIsSuccess(true);
			// } catch (error) {
			// 	setIsError(true);
			// }
			// setIsLoading(false);
			// await sleep(3000);
		}
	});

	return (
		<PageContainer>
			<Header
				isLoading={isLoading}
				isSuccess={isSuccess}
				loadingMessage="Running command..."
				successMessage="Run successfully"
			/>
			<ScrollContainer>
				<Box flexShrink={0} flexDirection="column">
					<Box gap={1} flexDirection="column">
						<Box>
							<Text color={BaseColors.Gray200}>{activeStep?.step_title}</Text>
						</Box>

						<Box>
							<Text color={BaseColors.Gray200}>
								{activeStep?.step_description}
							</Text>
						</Box>

						<Box paddingX={1} flexGrow={0}>
							<Text>{highlightedBashCommand}</Text>
						</Box>

						{output && (
							<Box gap={0} flexDirection="column">
								<Box paddingY={1}>
									<Text color={BaseColors.Gray200}>
										{figureSet.triangleDown}{' '}
									</Text>
									<Text color={BaseColors.Gray200}>Logs</Text>
								</Box>
								<Box
									paddingY={0}
									paddingX={2}
									borderTop={false}
									borderBottom={false}
									borderRight={false}
								>
									<Text color={BaseColors.Gray200}>{output}</Text>
								</Box>
							</Box>
						)}
					</Box>
				</Box>
			</ScrollContainer>
			<Footer
				controls={['esc', 'enter', 'up', 'down']}
				enterLabel={'run command'}
			/>
		</PageContainer>
	);
};
