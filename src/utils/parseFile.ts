import {fs} from 'zx';
import {getGitHash} from '../scripts/getGitHash.js';
import type {CodeDocument} from '../types/CodeDocument.js';
import {codeSplitter} from './splitter/codeSplitter/codeSplitter.js';

export const parseFile = async (filePath: string): Promise<CodeDocument> => {
	const gitHash = await getGitHash();
	const sourceCode = (await fs.readFile(filePath)).toString();
	return await codeSplitter({
		gitHash,
		filePath,
		sourceCode,
		chunkSize: 1500,
	});
};
