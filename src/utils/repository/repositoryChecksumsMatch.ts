import {compareAllChecksums} from '../compareAllChecksums.js';

export const repositoryChecksumsMatch = async () => {
	const filePaths = await compareAllChecksums();
	if (filePaths.length > 0) {
		throw new Error('Checksums do not match');
	}

	return true;
};
