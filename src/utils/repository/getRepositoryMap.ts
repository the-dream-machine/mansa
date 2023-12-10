import {fs} from 'zx';
import {manjaroRepositoryPath} from '../manjaroPath.js';
import type {FileMapItem} from '../../types/FileMapItem.js';

export const getRepositoryMap = async (): Promise<FileMapItem[]> =>
	await fs.readJson(`${manjaroRepositoryPath}/map.json`);
