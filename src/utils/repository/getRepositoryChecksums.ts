import {fs} from 'zx';
import {fishcakeRepositoryPath} from '../fishcakePath.js';
import type {FileChecksumItem} from '../../types/FileChecksumItem.js';

export const getRepositoryChecksums = async (): Promise<FileChecksumItem[]> =>
	await fs.readJson(`${fishcakeRepositoryPath}/checksums.json`);
