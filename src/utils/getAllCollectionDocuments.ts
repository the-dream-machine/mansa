import {getRepoConfig} from '../scripts/getRepoConfig.js';
import {chroma} from './chroma.js';
import {getEmbeddingFunction} from './embeddingFunction.js';

interface Args {
	collectionName: string;
	query: string[];
	limit?: number;
}

export const getAllCollectionDocuments = async ({query}: Args) => {
	const config = await getRepoConfig();
	const embeddingFunction = await getEmbeddingFunction();
	const collection = await chroma.getCollection({
		name: config.repo,
		embeddingFunction,
	});

	const queryResults = await collection.query({
		queryTexts: query,
		nResults: config.filePaths.length + 1,
	});
	// const queryResults = await collection.get()

	const results = queryResults.documents?.[0]?.map((document, index) => ({
		document,
		metadata: queryResults.metadatas?.[0]?.[index],
	}));
	console.log('🌱 # results:', JSON.stringify(results));

	return results;
};
