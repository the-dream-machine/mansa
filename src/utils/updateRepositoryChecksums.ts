import {fs} from 'zx';
import {createChecksum} from './createChecksum.js';
import {fishcakeRepoPath} from './fishcakePath.js';
import {
	type ChecksumFile,
	getRepositoryChecksums,
} from './getRepositoryChecksums.js';
import {writeFile} from './writeFile.js';

interface Args {
	filePath: string;
}

export const updateRepositoryChecksums = async ({filePath}: Args) => {
	const checksum = await createChecksum({filePath});
	const repositoryChecksumFilePath = `${fishcakeRepoPath}/checksums.json`;
	let updatedChecksums: ChecksumFile[] = [];

	if (await fs.exists(repositoryChecksumFilePath)) {
		const savedChecksums = await getRepositoryChecksums();
		updatedChecksums = [...savedChecksums, {filePath, checksum}];
	} else {
		updatedChecksums = [{filePath, checksum}];
	}

	await writeFile({
		filePath: repositoryChecksumFilePath,
		fileContent: JSON.stringify(updatedChecksums),
	});
};
