import {chroma} from './chroma.js';
import {getEmbeddingFunction} from './embeddingFunction.js';

interface Args {
	collectionName: string;
	query: string[];
	limit?: number;
}

export const queryCollection = async ({collectionName, query, limit}: Args) => {
	const embeddingFunction = await getEmbeddingFunction();
	const collection = await chroma.getCollection({
		name: collectionName,
		embeddingFunction,
	});

	const result = await collection.query({
		queryTexts: query, // query_text
		nResults: limit, // n_results
		// where: {"metadata_field": "is_equal_to_this"}, // where
	});

	return result;
};
