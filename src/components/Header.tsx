import {Box, Text} from 'ink';
import React from 'react';
import {Colors} from '../styles/Colors.js';

interface Props {
	title?: string;
	titleTextColor?: string;
	titleBackgroundColor?: string;

	isLoading?: boolean;
	isSuccess?: boolean;
	isError?: boolean;
	loadingMessage?: string;
	successMessage?: string;
	errorMessage?: string;
}
export const Header = ({
	title = 'Trigger.dev',
	titleTextColor = '#ffffff',
	titleBackgroundColor = '#4eb03a',

	isLoading = false,
	isSuccess = false,
	isError = false,
	loadingMessage = 'Loading...',
	successMessage = 'Success',
	errorMessage = 'Error',
}: Props) => (
	<Box paddingTop={2} paddingX={3} gap={1} width={'100%'} flexShrink={0}>
		<Text color={titleTextColor} backgroundColor={titleBackgroundColor} bold>
			{' '}
			{title}{' '}
		</Text>
		{isLoading && (
			<Box paddingX={1}>
				<Text color={Colors.LightYellow}>•</Text>
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
