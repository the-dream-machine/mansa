import {fs} from 'zx';
import {jojiRepositoryPath} from '../jojiPath.js';
import type {FileMapItem} from '../../types/FileMapItem.js';

export const getRepositoryMap = async (): Promise<FileMapItem[]> =>
	await fs.readJson(`${jojiRepositoryPath}/map.json`);
