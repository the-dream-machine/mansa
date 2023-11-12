import {fs} from 'zx';
import {fishcakeRepoPath} from './fishcakePath.js';
import type {FileMapItem} from '../types/FileMapItem.js';

export const getRepositoryMap = async (): Promise<FileMapItem[]> =>
	await fs.readJson(`${fishcakeRepoPath}/map.json`);
