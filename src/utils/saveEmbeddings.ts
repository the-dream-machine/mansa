import {ChromaClient, TransformersEmbeddingFunction} from 'chromadb';
import type {CodeDocument} from '../types/CodeDocument.js';

interface Args {
	codeDocuments: CodeDocument[];
	collectionName: string;
}

const client = new ChromaClient({
	path: 'http://localhost:6969',
});

const embeddingFunction = new TransformersEmbeddingFunction({
	model: 'Xenova/bge-base-en-v1.5',
});

export const saveEmbeddings = async ({codeDocuments, collectionName}: Args) => {
	try {
		const collection = await client.getOrCreateCollection({
			embeddingFunction,
			name: collectionName,
			metadata: {
				description: 'code_embeddings',
			},
		});

		let ids: string[] = [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let metadatas: any[] = [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let documents: any[] = [];

		for (const codeDoc of codeDocuments) {
			for (const [index, value] of codeDoc.chunks.entries()) {
				ids = [...ids, `${codeDoc.id}_${index}`];
				metadatas = [...metadatas, codeDoc.metadata];
				documents = [...documents, value];
			}
		}

		const batchSave = async <T>(
			array: T[],
			batchSize: number,
		): Promise<void> => {
			for (let i = 0; i < array.length; i += batchSize) {
				await collection.add({
					ids: ids.slice(i, i + batchSize),
					metadatas: metadatas.slice(i, i + batchSize),
					documents: documents.slice(i, i + batchSize),
				});
			}
		};

		await batchSave(ids, 20);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};
