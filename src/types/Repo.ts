import type {PackageManager} from './PackageManager.js';

export interface Repo {
	name: string;
	description?: string;
	version?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

export interface RepoConfig {
	packageManager: PackageManager;
}
