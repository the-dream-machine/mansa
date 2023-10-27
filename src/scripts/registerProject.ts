import {fs} from 'zx';

interface Project {
	name?: string;
	description?: string;
	version?: string;
	dependencies?: Record<string, string>[];
}

export const registerProject = async () => {
	try {
		const project: Project = await fs.readJson('./package.json');
		return project;
	} catch (err) {
		throw new Error("Couldn't find package.json");
	}
};
