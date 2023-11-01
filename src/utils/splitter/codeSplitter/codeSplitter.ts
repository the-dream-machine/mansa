import {getFileExtension} from '../../getFileExtension.js';
import {chunkNode} from './chunkNode.js';
import {setParserLanguage} from './setParserLanguage.js';
import {markdownSplitter} from '../markdownSplitter.js';
import {textSplitter} from '../textSplitter.js';
import type {CodeDocument} from '../../../types/CodeDocument.js';

interface Args {
	sourceCode: string;
	filePath: string;
	chunkSize: number;
	gitHash: string;
}

const miscFileExtensions = ['.env', '.example', '.txt', '.local'];

export const codeSplitter = async ({
	sourceCode,
	filePath,
	chunkSize,
	gitHash,
}: Args): Promise<CodeDocument> => {
	const fileExtension = getFileExtension({filePath});

	// Handle markdown
	if (fileExtension === 'md') {
		const chunks = await markdownSplitter({markdown: sourceCode, chunkSize});
		return {id: `${filePath}_${gitHash}`, chunks, metadata: {filePath}};
	}

	// Handle miscellaneous files
	if (miscFileExtensions.includes(fileExtension)) {
		const chunks = await textSplitter({text: sourceCode, chunkSize});
		return {id: `${filePath}_${gitHash}`, chunks, metadata: {filePath}};
	}

	// Handle code files
	try {
		const parser = setParserLanguage({fileExtension});
		const tree = parser.parse(sourceCode);

		// Handle parse errors
		if (
			!tree.rootNode.children ||
			tree.rootNode.children[0]?.type === 'ERROR'
		) {
			throw new Error(`Could not parse code`);
		}

		const nodeChunks = chunkNode({
			node: tree.rootNode,
			sourceCode,
			chunkSize,
		});

		// Greedy bundle
		const chunks: string[] = [];
		let currentChunk = '';
		for (const nodeChunk of nodeChunks) {
			if (currentChunk.length + nodeChunk.length < chunkSize) {
				currentChunk = currentChunk.concat(' ', nodeChunk);
			} else if (currentChunk.length + nodeChunk.length > chunkSize) {
				chunks.push(currentChunk);
				currentChunk = nodeChunk;
			}
		}
		chunks.push(currentChunk);
		return {id: `${filePath}_${gitHash}`, chunks, metadata: {filePath}};
	} catch (error) {
		// If all else fails, use regular text splitter
		const chunks = await textSplitter({text: sourceCode, chunkSize});
		return {id: `${filePath}_${gitHash}`, chunks, metadata: {filePath}};
	}
};
