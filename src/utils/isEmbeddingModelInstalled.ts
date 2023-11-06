import {getEmbeddingFunction} from './embeddingFunction.js';

export const isEmbeddingModelInstalled = async () => {
	const embeddingFunction = await getEmbeddingFunction();
	return await embeddingFunction.generate(['test']);
};
