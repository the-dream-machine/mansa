import {fs} from 'zx';
import {fishcakeRepoPath} from './fishcakePath.js';
import type {FishcakeRepoConfig} from '../types/FishcakeRepoConfig.js';

export const getFishcakeConfig = async (): Promise<FishcakeRepoConfig> =>
	await fs.readJson(`${fishcakeRepoPath}/config.json`);
