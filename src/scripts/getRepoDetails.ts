import {fs} from 'zx';

export interface Repo {
	name?: string;
	description?: string;
	version?: string;
	dependencies?: Record<string, string>[];
	devDependencies?: Record<string, string>[];
}

export const getRepoDetails = async () => {
	try {
		const repo: Repo = await fs.readJson('./package.json');
		return repo;
	} catch (err) {
		throw new Error("Couldn't find package.json");
	}
};
