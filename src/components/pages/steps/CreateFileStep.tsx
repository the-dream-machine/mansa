import React, {useEffect, useState} from 'react';
import {Box, Spacer, Text, useApp, useInput} from 'ink';
import * as prettier from 'prettier';

import {StepsContext} from '../../StepsProvider.js';
import {BaseColors, Colors} from '../../Colors.js';
import {PageContainer} from '../../PageContainer.js';
import {ScrollContainer} from '../../ScrollContainer.js';
import {Footer} from '../../Footer.js';
import {highlight} from 'prismjs-terminal';
import loadLanguages from 'prismjs/components/index.js';
import {StepsEvent, StepsState} from '../../../machines/stepsMachine.js';
import {Header} from '../../Header.js';
import {defaultTheme} from '../../../utils/prismThemes.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call

export const CreateFileStep = () => {
	const [formattedCodeChanges, setFormattedCodeChanges] = useState('');
	const [state, send] = StepsContext.useActor();
	const activeStepIndex = state.context.activeStepIndex;
	const activeStep = state.context.steps?.[activeStepIndex];
	const rawCodeChanges =
		activeStep?.new_file_path_to_create?.file_code_changes ?? '';
	const fileExtension =
		activeStep?.new_file_path_to_create?.file_extension ?? '';
	const filepath = activeStep?.new_file_path_to_create?.file_path ?? '';
	const totalSteps = state.context.steps?.length;
	const isLoading = state.matches(StepsState.ACTIVE_STEP_RUNNING);
	const isSuccess = state.matches(StepsState.ACTIVE_STEP_SUCCESS_IDLE);
	const isError = state.matches(StepsState.ACTIVE_STEP_ERROR_IDLE);
	const isLanguageSupported = !['local', 'example'].includes(fileExtension);
	const getStateColor = (color: Colors | BaseColors) =>
		isSuccess ? Colors.DarkGray : color;
	const getEnterLabel = () => {
		if (isSuccess) {
			return 'next step';
		} else if (isError) {
			return 'retry';
		} else {
			return 'create file';
		}
	};

	useEffect(() => {
		if (isLanguageSupported) {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			(async () => {
				const formattedCodeChanges = await prettier.format(rawCodeChanges, {
					filepath,
				});
				setFormattedCodeChanges(formattedCodeChanges);
			})();
		} else {
			setFormattedCodeChanges(rawCodeChanges);
		}
	}, []);

	let codeChanges = rawCodeChanges;
	if (isLanguageSupported) {
		loadLanguages([fileExtension]);

		codeChanges = highlight(formattedCodeChanges, {
			language: fileExtension,
			theme: defaultTheme,
		});
	}

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
			<Header
				isLoading={isLoading}
				isSuccess={isSuccess}
				loadingMessage={`Creating ${filepath}`}
				successMessage="Created successfully"
			/>
			<Box>
				<Box flexDirection="row" gap={4}>
					{/* Left Block */}
					<Box flexDirection="column" gap={1}>
						{/* Title */}
						<Text color={BaseColors.White}>
							{activeStep?.step_title}{' '}
							<Text color={Colors.DarkGray}>
								(Step {activeStepIndex + 1} of {totalSteps})
							</Text>
						</Text>

						{/* Description step */}
						<Box gap={1}>
							<Text color={getStateColor(Colors.LightGreen)}>•</Text>
							<Box flexDirection="column" gap={1}>
								<Text color={getStateColor(Colors.LightGray)}>
									{activeStep?.step_description}
								</Text>
								<Text color={getStateColor(Colors.DarkGray)}>
									Press{' '}
									<Text color={getStateColor(BaseColors.Gray500)}>enter</Text>{' '}
									to create{' '}
									<Text color={getStateColor(BaseColors.Gray500)} italic>
										{filepath}
									</Text>{' '}
									and apply the code changes.
								</Text>
							</Box>
						</Box>

						{/* Success step */}
						{isSuccess && (
							<Box gap={1} flexShrink={0} marginTop={1}>
								<Text color={Colors.LightGreen}>•</Text>
								<Text color={Colors.LightGray}>
									Press <Text color={Colors.White}>enter</Text> to go to the
									next step.
								</Text>
							</Box>
						)}
					</Box>

					{/* Code block */}
					<Box
						minWidth={50}
						flexDirection="column"
						flexShrink={0}
						gap={1}
						paddingTop={1}
						paddingX={2}
						marginTop={2}
						borderColor={BaseColors.Gray800}
						borderStyle="round"
					>
						<Text color={BaseColors.Gray700} italic>
							{activeStep?.new_file_path_to_create?.file_path}
						</Text>
						<ScrollContainer>
							<Box paddingBottom={8}>
								<Text>{codeChanges}</Text>
							</Box>
						</ScrollContainer>
					</Box>
				</Box>
			</Box>
			<Spacer />
			<Footer
				controls={['enter', 'esc', 'up', 'down']}
				enterLabel={getEnterLabel()}
				enterDisabled={isLoading}
			/>
		</PageContainer>
	);
};
