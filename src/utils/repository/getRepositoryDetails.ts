import {fs} from 'zx';

export interface Repo {
	name: string;
	description?: string;
	version?: string;
	dependencies?: Record<string, string>[];
	devDependencies?: Record<string, string>[];
}

export const getRepositoryDetails = async (): Promise<Repo> =>
	await fs.readJson('./package.json');
