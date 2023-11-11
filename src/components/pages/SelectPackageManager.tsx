import React from 'react';
import {Text, useApp, useInput} from 'ink';
import {type Option, Select} from '@inkjs/ui';
import {useMachine} from '@xstate/react';

import {PageContainer} from '../PageContainer.js';
import {Header} from '../Header.js';
import {Body} from '../Body.js';
import {Footer} from '../Footer.js';
import {NavigationContext} from '../NavigationProvider.js';
import {
	SelectPackageManagerEvent,
	selectPackageManagerMachine,
} from '../../machines/selectPackageManagerMachine.js';
import {type PackageManager} from '../../types/PackageManager.js';

const options: Option[] = [
	{label: 'npm', value: 'npm'},
	{label: 'yarn', value: 'yarn'},
	{label: 'pnpm', value: 'pnpm'},
	{label: 'bun', value: 'bun'},
];

const SelectPackageManager = () => {
	const [, navigate] = NavigationContext.useActor();
	const [state, send] = useMachine(selectPackageManagerMachine, {
		context: {navigate},
	});

	const {exit} = useApp();
	useInput((_, key) => {
		if (key.escape) {
			exit();
		}
	});

	const repositoryName = state.context.repositoryName;

	return (
		<PageContainer>
			<Header title={`Set up fishcake for ${repositoryName}`} subtitle="1/2" />
			<Body>
				<Text>
					Which package manager are you currently using for this project?
				</Text>

				<Select
					options={options}
					onChange={value => {
						send({
							type: SelectPackageManagerEvent.SUBMIT_SELECTION,
							selection: value as PackageManager,
						});
					}}
				/>
			</Body>
			<Footer controls={['esc', 'enter', 'up', 'down']} />
		</PageContainer>
	);
};

export default SelectPackageManager;
