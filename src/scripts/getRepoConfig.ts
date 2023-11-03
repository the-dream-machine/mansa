import {fs} from 'zx';
import type {Config} from '../types/Config.js';

export const getRepoConfig = async () => {
	try {
		const config: Config = await fs.readJson('./.fishcake/config.json');
		return config;
	} catch (err) {
		throw new Error("Couldn't find package.json");
	}
};
