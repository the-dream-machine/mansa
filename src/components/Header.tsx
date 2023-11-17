import {Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React from 'react';
import {BaseColors, Colors} from './Colors.js';

interface Props {
	isLoading?: boolean;
	isSuccess?: boolean;
	isError?: boolean;
	loadingMessage?: string;
	successMessage?: string;
	errorMessage?: string;
}
export const Header = ({
	isLoading = false,
	isSuccess = false,
	isError = false,
	loadingMessage = 'Loading...',
	successMessage = 'Success',
	errorMessage = 'Error',
}: Props) => (
	<Box paddingY={1} gap={1} width={'100%'} flexShrink={0}>
		<Text color="#FFFFFF" backgroundColor="#4eb03a" bold>
			{' '}
			Trigger.dev{' '}
		</Text>
		{isLoading && (
			<Box paddingX={1}>
				<Spinner type="dots12" />
				<Text color={Colors.DarkYellow}> {loadingMessage}</Text>
			</Box>
		)}
		{isSuccess && (
			<Box paddingX={1}>
				<Text color={Colors.LightGreen}>•</Text>
				<Text color={Colors.DarkGreen}> {successMessage}</Text>
			</Box>
		)}
		{isError && (
			<Box paddingX={1}>
				<Text color={Colors.LightRed}>•</Text>
				<Text color={Colors.DarkRed}> {errorMessage}</Text>
			</Box>
		)}
	</Box>
);
