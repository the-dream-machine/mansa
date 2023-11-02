import {ChromaClient, TransformersEmbeddingFunction} from 'chromadb';
import type {CodeDocument} from '../types/CodeDocument.js';
import {env} from '@xenova/transformers';
import {fishcakePath} from './userPath.js';
import {Dispatch} from 'react';

interface Args {
	codeDocuments: CodeDocument[];
	collectionName: string;
	setProgress: Dispatch<React.SetStateAction<number>>;
}

const client = new ChromaClient({
	path: 'http://localhost:6969',
});

env.localModelPath = `${fishcakePath}/models/`;
const embeddingFunction = new TransformersEmbeddingFunction({
	model: 'Xenova/bge-base-en-v1.5',
	quantized: false,
});

export const saveEmbeddings = async ({
	codeDocuments,
	collectionName,
	setProgress,
}: Args) => {
	try {
		const collection = await client.getOrCreateCollection({
			embeddingFunction,
			name: collectionName,
			metadata: {
				description: 'code_embeddings',
			},
		});

		const totalDocs = codeDocuments.length;

		for (const [index, codeDoc] of codeDocuments.entries()) {
			for (const [childIndex, value] of codeDoc.chunks.entries()) {
				const ids = [`${codeDoc.id}_${childIndex}`];
				const metadatas = [codeDoc.metadata];
				const documents = [value];

				await collection.add({ids, metadatas, documents});
			}
			setProgress(Math.round(((index + 1) / totalDocs) * 100));
		}

		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};
