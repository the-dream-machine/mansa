import {fs} from 'zx';
import {fishcakeRepositoryPath} from './fishcakePath.js';
import type {FileMapItem} from '../types/FileMapItem.js';

export const getRepositoryMap = async (): Promise<FileMapItem[]> =>
	await fs.readJson(`${fishcakeRepositoryPath}/map.json`);
