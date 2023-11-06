import {fishcakePath} from './fishcakePath.js';
import {env} from '@xenova/transformers';

env.localModelPath = `${fishcakePath}/models/`;
env.cacheDir = `${fishcakePath}/.cache/`;

export const getEmbeddingFunction = async () => {
	const {TransformersEmbeddingFunction} = await import('chromadb');
	return new TransformersEmbeddingFunction({
		model: 'Xenova/bge-base-en-v1.5',
		quantized: false,
	});
};
