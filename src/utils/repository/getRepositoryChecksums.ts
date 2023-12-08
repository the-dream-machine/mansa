import {fs} from 'zx';
import {jojiRepositoryPath} from '../jojiPath.js';
import type {FileChecksumItem} from '../../types/FileChecksumItem.js';

export const getRepositoryChecksums = async (): Promise<FileChecksumItem[]> =>
	await fs.readJson(`${jojiRepositoryPath}/checksums.json`);
