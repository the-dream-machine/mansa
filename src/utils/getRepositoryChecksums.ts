import {fs} from 'zx';
import {fishcakeRepoPath} from './fishcakePath.js';

export interface ChecksumFile {
	filePath: string;
	checksum: string;
}

export const getRepositoryChecksums = async (): Promise<ChecksumFile[]> =>
	await fs.readJson(`${fishcakeRepoPath}/checksums.json`);
