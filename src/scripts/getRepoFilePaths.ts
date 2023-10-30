import {$} from 'zx';

export const getRepoFilePaths = async () => {
	const terminalOutput =
		await $`find . \\( -name "node_modules" -o -name ".git" -o -name ".next" -o -name ".fishcake" -o -name "public" \\) -prune -o -type f -print`.quiet();
	const paths = terminalOutput.stdout.trim().split('\n');

	return paths;
};
