import {chroma} from './chroma.js';
import {embeddingFunction} from './embeddingFunction.js';
import type {CodeDocument} from '../types/CodeDocument.js';

interface Args {
	document: CodeDocument;
	collectionName: string;
}

export const saveFileEmbeddings = async ({document, collectionName}: Args) => {
	const collection = await chroma.getOrCreateCollection({
		embeddingFunction,
		name: collectionName,
		metadata: {
			description: 'code_embeddings',
		},
	});

	for (const [index, chunk] of document.chunks.entries()) {
		const ids = [`${document.id}_${index}`];
		const metadatas = [document.metadata];
		const documents = [chunk];

		await collection.add({ids, metadatas, documents});
	}

	return;
};
