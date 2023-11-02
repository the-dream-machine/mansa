import {fs} from 'zx';
import {getGitHash} from '../scripts/getGitHash.js';
import type {CodeDocument} from '../types/CodeDocument.js';
import {codeSplitter} from './splitter/codeSplitter/codeSplitter.js';

export const parseFiles = async (
	filePaths: string[],
): Promise<CodeDocument[]> => {
	let codeDocuments: CodeDocument[] = [];
	const gitHash = await getGitHash();

	for (const filePath of filePaths) {
		const sourceCode = (await fs.readFile(filePath)).toString();

		try {
			const splitCode = await codeSplitter({
				gitHash,
				filePath,
				sourceCode,
				chunkSize: 1500,
			});

			codeDocuments = [...codeDocuments, splitCode];
		} catch (error) {
			console.error(error);
		}
	}

	return codeDocuments;
};
