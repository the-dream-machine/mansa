import {$} from 'zx';

export const getGitHash = async () => {
	const result = await $`git rev-parse HEAD`.quiet();
	return result.stdout;
};
