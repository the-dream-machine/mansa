import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import React, {useEffect, useState} from 'react';
import {z} from 'zod';
import {Box, BoxProps, Spacer, Text, TextProps} from 'ink';
import {getAllFilePaths} from '../scripts/getAllFilePaths.js';
import {
	Select,
	type Option,
	TextInput,
	ThemeProvider,
	extendTheme,
	defaultTheme,
	MultiSelect,
} from '@inkjs/ui';

import Fuse from 'fuse.js';

import {ColorName} from 'chalk';
import figureSet from 'figures';

// import {TaskList, Task} from 'ink-task-list';

const queryClient = new QueryClient();

export const schema = z.object({
	name: z.string().default('Stranger').describe('Name').optional(),
});

type Props = z.infer<typeof schema>;

const customTheme = extendTheme(defaultTheme, {
	components: {
		MultiSelect: {
			styles: {
				focusIndicator: (): TextProps => ({
					color: 'magenta',
				}),

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				label: ({isFocused, isSelected}: any): TextProps => {
					let color: ColorName = 'gray';

					if (isSelected) {
						color = 'white';
					}
					if (isFocused) {
						color = 'magenta';
					}

					return {
						color,
					};
				},
				selectedIndicator: (): TextProps => ({
					color: 'white',
				}),
				container: (): BoxProps => ({
					flexDirection: 'column',
				}),
				highlightedText: (): TextProps => ({
					color: 'green',
				}),
			},
		},
	},
});

interface HeaderProps {
	selectedCount: number;
	totalCount: number;
}

const Header = ({selectedCount, totalCount}: HeaderProps) => {
	return (
		<Box alignItems="flex-start" gap={0}>
			<Box borderStyle="single" paddingX={1} flexShrink={0}>
				<Text>🍥 Select files to index </Text>
				<Text color={'gray'} dimColor>
					({selectedCount.toLocaleString('en-US')}/
					{totalCount.toLocaleString('en-US')})
				</Text>
			</Box>
			<Box
				paddingBottom={1}
				borderStyle="single"
				borderTop={false}
				borderRight={false}
				borderLeft={false}
				width="100%"
			/>
		</Box>
	);
};
interface FooterProps {
	searchResultsCount: number;
}
const Footer = ({searchResultsCount}: FooterProps) => {
	return (
		<Box>
			<Text color="gray">
				<Text color="white">{figureSet.triangleUp}</Text> up •{' '}
				<Text color="white">{figureSet.triangleDown}</Text> down •{' '}
				<Text color="white">tab</Text> toggle selection •{' '}
				<Text color="white">type</Text> to search{' '}
				{searchResultsCount === 1 && `(${searchResultsCount} result)`}
				{searchResultsCount > 1 && `(${searchResultsCount} results)`}
			</Text>
			<Spacer />
			<Text color="gray">
				<Text color="white">enter</Text> submit
			</Text>
		</Box>
	);
};

export const Initialize = ({name = 'Stranger'}: Props) => {
	const [filePaths, setFilePaths] = useState<string[]>([]);
	const [searchQuery, setSetSearchQuery] = useState('');
	const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

	const fuse = new Fuse(filePaths, {threshold: 0.3});

	let options: Option[] = [];
	if (filePaths.length > 0) {
		if (searchQuery) {
			const results = fuse.search(searchQuery);

			options = results
				.map(result => result.item)
				.map(filePath => ({label: filePath, value: filePath}));
		} else {
			options = filePaths.map(filePath => ({label: filePath, value: filePath}));
		}
	}

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		(async () => {
			const paths = await getAllFilePaths();
			setFilePaths(paths);
			setSelectedPaths(paths);
		})();
	}, [setSelectedPaths]);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={customTheme}>
				<Box flexDirection="column" gap={1} width={'100%'}>
					<Header
						totalCount={filePaths.length}
						selectedCount={selectedPaths.length}
					/>
					<Text color={'gray'}>
						Fishcake indexes your repository locally, and searches the index to
						generate accurate suggestions. We recommend removing sensitive files
						like <Text color="white">.env</Text> and{' '}
						<Text color="white">.cert</Text> files from being indexed. You can
						also remove <Text color="white">"noisy"</Text> files like{' '}
						<Text color="white">.log,</Text> <Text color="white">.lock, </Text>
						and <Text color="white">.git</Text> files to speed up queries.
					</Text>
					<TextInput
						placeholder="Search..."
						onChange={query => {
							setSetSearchQuery(query);
						}}
					/>

					{options.length > 0 && selectedPaths.length > 0 ? (
						<MultiSelect
							defaultValue={selectedPaths}
							visibleOptionCount={20}
							highlightText={searchQuery}
							options={options}
							onChange={value => {
								setSelectedPaths(value);
							}}
						/>
					) : (
						<Text color={'red'}>No results found</Text>
					)}

					<Footer searchResultsCount={searchQuery ? options.length : 0} />
				</Box>
			</ThemeProvider>
		</QueryClientProvider>
	);
};
