import {fs} from 'zx';
import {fishcakeRepositoryPath} from './fishcakePath.js';
import type {FishcakeRepoConfig} from '../types/FishcakeRepoConfig.js';

export const getRepositoryConfig = async (): Promise<FishcakeRepoConfig> =>
	await fs.readJson(`${fishcakeRepositoryPath}/config.json`);
