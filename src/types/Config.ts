export interface Config {
	repo: string;
	version?: string;
	dependencies?: Record<string, string>[];
	devDependencies?: Record<string, string>[];
}
