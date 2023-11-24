import React from 'react';
import {Spacer, Text, useApp, useInput} from 'ink';
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
import {BaseColors, Colors} from '../Colors.js';

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

	return (
		<PageContainer>
			<Header title="Fishcake" titleBackgroundColor={BaseColors.Pink500} />
			<Body>
				<Text color={Colors.White}>
					Set up fishcake <Text color={Colors.DarkGray}>(Step 1 of 2)</Text>
				</Text>
				<Text color={Colors.LightGray}>
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
			<Spacer />
			<Footer controls={['esc', 'enter', 'up', 'down']} />
		</PageContainer>
	);
};

export default SelectPackageManager;
