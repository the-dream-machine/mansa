import {fs} from 'zx';
import {mansaRepositoryPath} from '../mansaPath.js';
import type {FileMapItem} from '../../types/FileMapItem.js';

export const getRepositoryMap = async (): Promise<FileMapItem[]> =>
	await fs.readJson(`${mansaRepositoryPath}/map.json`);
