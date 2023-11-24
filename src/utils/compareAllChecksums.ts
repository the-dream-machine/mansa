import {createChecksum} from './createChecksum.js';
import {getRepositoryChecksums} from './repository/getRepositoryChecksums.js';
import {getRepositoryFilePaths} from './repository/getRepositoryFilePaths.js';

/**
 * @returns string of file paths to be indexed
 */
export const compareAllChecksums = async () => {
	const currentFileChecksums = await getRepositoryChecksums();
	const repositoryFilePaths = await getRepositoryFilePaths();

	let filePathsToIndex: string[] = [];
	for (const filePath of repositoryFilePaths) {
		const indexedFile = currentFileChecksums.find(
			currentFileChecksum => currentFileChecksum.filePath === filePath,
		);

		// If file hasn't been indexed before, add to list of files to index
		if (!indexedFile) {
			filePathsToIndex = [...filePathsToIndex, filePath];
		}
		// If file has been indexed, compare checksums
		else {
			const currentFileChecksum = indexedFile.checksum;
			const fileChecksum = await createChecksum({filePath});

			// File content has changed
			if (currentFileChecksum !== fileChecksum) {
				filePathsToIndex = [...filePathsToIndex, filePath];
			}
		}
	}

	return filePathsToIndex;
};
