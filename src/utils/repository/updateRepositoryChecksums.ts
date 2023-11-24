import {fs} from 'zx';
import {createChecksum} from '../createChecksum.js';
import {fishcakeRepositoryPath} from '../fishcakePath.js';
import {getRepositoryChecksums} from './getRepositoryChecksums.js';
import {writeToFile} from '../writeToFile.js';
import type {FileChecksumItem} from '../../types/FileChecksumItem.js';

interface Args {
	filePath: string;
}

export const updateRepositoryChecksums = async ({filePath}: Args) => {
	const checksum = await createChecksum({filePath});
	const repositoryChecksumFilePath = `${fishcakeRepositoryPath}/checksums.json`;
	let updatedChecksums: FileChecksumItem[] = [];

	if (await fs.exists(repositoryChecksumFilePath)) {
		const savedChecksumItems = await getRepositoryChecksums();

		// Find the index of the existing item with the same filePath
		const existingChecksumIndex = savedChecksumItems.findIndex(
			savedChecksum => savedChecksum.filePath === filePath,
		);

		// If an item with the same filePath exists, replace it
		if (existingChecksumIndex !== -1) {
			savedChecksumItems[existingChecksumIndex] = {filePath, checksum};
			updatedChecksums = savedChecksumItems;
		} else {
			// If no item with the same filePath exists, add the new item
			updatedChecksums = [...savedChecksumItems, {filePath, checksum}];
		}
	} else {
		updatedChecksums = [{filePath, checksum}];
	}

	await writeToFile({
		filePath: repositoryChecksumFilePath,
		fileContent: JSON.stringify(updatedChecksums),
	});
};
