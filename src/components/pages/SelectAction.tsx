import React, {useState} from 'react';
import {Spinner} from '@inkjs/ui';
import {useApp, useInput, Text, Box} from 'ink';
import highlight from 'prism-cli';
import {$, sleep} from 'zx';

import {Footer} from '../Footer.js';
import {PageContainer} from '../PageContainer.js';
import {Body} from '../Body.js';
import {type Step} from '../../types/Step.js';
import {Colors} from '../Colors.js';
import {ScrollContainer} from '../ScrollContainer.js';
import {ScrollArea} from '../ScrollArea.js';

const steps: Step[] = [
	{
		step_title: 'Installing Trigger.dev Packages',
		step_description:
			"In this step, we'll install the necessary Trigger.dev SDK and Next.js integration packages using yarn.",
		step_type: 'run_bash_command',
		bash_command_to_run: 'yarn add @trigger.dev/sdk @trigger.dev/nextjs',
	},
	{
		step_title: 'Adding Environment Variables',
		step_description:
			"Create a '.env.local' file with the Trigger API key and URL environment variables.",
		step_type: 'create_file',
		new_file_paths_to_create: [
			{
				file_path: '.env.local',
				file_content_summary:
					'Configuration file with Trigger API key and URL.',
			},
		],
	},
	{
		step_title: 'Configuring the Trigger Client',
		step_description:
			"Create a Trigger client configuration file in the 'src' directory of the project.",
		step_type: 'create_file',
		new_file_paths_to_create: [
			{
				file_path: 'src/trigger.ts',
				file_content_summary:
					'Configuration file that creates and exports a new TriggerClient instance.',
			},
		],
	},
	{
		step_title: 'Creating the API Route',
		step_description:
			"Create an API route file within the 'pages/api/' directory for Trigger.dev.",
		step_type: 'create_file',
		new_file_paths_to_create: [
			{
				file_path: 'src/pages/api/trigger.ts',
				file_content_summary:
					'API route file for interacting with Trigger.dev.',
			},
		],
	},
	{
		step_title: 'Creating the Example Job',
		step_description: 'Create a jobs folder and add job definition files.',
		step_type: 'create_file',
		new_file_paths_to_create: [
			{
				file_path: 'src/Jobs/example.ts',
				file_content_summary: 'Defines an example job for Trigger.dev.',
			},
			{
				file_path: 'src/Jobs/index.ts',
				file_content_summary: 'Exports all jobs defined in the folder.',
			},
		],
	},
	{
		step_title: 'Adding Configuration to package.json',
		step_description:
			"Add Trigger.dev configuration in the 'package.json' file under the root object.",
		step_type: 'modify_file',
		existing_file_paths_to_modify: [
			{
				file_path: 'package.json',
				file_modification_summary: 'Add Trigger.dev endpointId configuration.',
			},
		],
	},
	{
		step_title: 'Running Next.js App',
		step_description: 'Run the Next.js app locally with yarn.',
		step_type: 'run_bash_command',
		bash_command_to_run: 'yarn run dev',
	},
	{
		step_title: 'Running Trigger.dev CLI Dev Command',
		step_description:
			"Run the Trigger.dev CLI 'dev' command in a separate terminal window or tab.",
		step_type: 'run_bash_command',
		bash_command_to_run: 'yarn dlx @trigger.dev/cli@latest dev',
	},
];

const firstStep = steps[0];
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const highlightedBashCommand = highlight(
	firstStep?.bash_command_to_run,
	'bash',
);

export const SelectAction = () => {
	const [output, setOutput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [isError, setIsError] = useState(false);

	const {exit} = useApp();
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	useInput(async (_, key) => {
		if (key.escape) {
			exit();
		}
		if (key.return) {
			setIsLoading(true);
			try {
				await sleep(4000);
				const process =
					await $`bun add @trigger.dev/sdk @trigger.dev/nextjs`.quiet();
				for (const chunk of process.stdout) {
					setOutput(currentOutput => currentOutput.concat(chunk));
				}
				setIsSuccess(true);
			} catch (error) {
				setIsError(true);
			}
			setIsLoading(false);
			await sleep(3000);
		}
	});

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box paddingY={1} gap={1}>
				<Text color="#FFFFFF" backgroundColor="#4eb03a" bold>
					{' '}
					Trigger.dev{' '}
				</Text>
				{isLoading && (
					<Box paddingX={1}>
						<Spinner type="dots" />
						<Text color={Colors.LightGrey}> Running command...</Text>
					</Box>
				)}
				{isSuccess && (
					<Box paddingX={1}>
						<Text color={Colors.LightGreen}>●</Text>
						<Text color={Colors.White}> Run successful</Text>
					</Box>
				)}
			</Box>
			<ScrollArea>
				<Box flexShrink={0} flexDirection="column">
					<Box gap={1} flexDirection="column">
						<Box>
							<Text color={Colors.LightGrey}>{firstStep?.step_title}</Text>
						</Box>

						<Box>
							<Text color={Colors.DarkGrey}>{firstStep?.step_description}</Text>
						</Box>

						<Box paddingX={1} flexGrow={0}>
							<Text>{highlightedBashCommand}</Text>
						</Box>

						{output && (
							<>
								<Text>Logs:</Text>
								<Box borderStyle="single" borderColor="gray" paddingX={1}>
									<Text color="gray">{output}</Text>
								</Box>
							</>
						)}
					</Box>
				</Box>
			</ScrollArea>
			<Footer
				controls={['esc', 'enter', 'up', 'down']}
				enterLabel={'run command'}
			/>
		</Box>
	);
};
