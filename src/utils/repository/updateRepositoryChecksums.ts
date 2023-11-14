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
		const savedChecksums = await getRepositoryChecksums();
		updatedChecksums = [...savedChecksums, {filePath, checksum}];
	} else {
		updatedChecksums = [{filePath, checksum}];
	}

	await writeToFile({
		filePath: repositoryChecksumFilePath,
		fileContent: JSON.stringify(updatedChecksums),
	});
};
