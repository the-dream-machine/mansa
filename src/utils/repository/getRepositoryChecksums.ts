import {fs} from 'zx';
import {mansaRepositoryPath} from '../mansaPath.js';
import type {FileChecksumItem} from '../../types/FileChecksumItem.js';

export const getRepositoryChecksums = async (): Promise<FileChecksumItem[]> =>
	await fs.readJson(`${mansaRepositoryPath}/checksums.json`);
