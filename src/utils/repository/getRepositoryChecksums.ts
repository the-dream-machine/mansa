import {fs} from 'zx';
import {manjaroRepositoryPath} from '../manjaroPath.js';
import type {FileChecksumItem} from '../../types/FileChecksumItem.js';

export const getRepositoryChecksums = async (): Promise<FileChecksumItem[]> =>
	await fs.readJson(`${manjaroRepositoryPath}/checksums.json`);
