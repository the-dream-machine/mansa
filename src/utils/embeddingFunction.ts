import {TransformersEmbeddingFunction} from 'chromadb';
import {fishcakePath} from './userPath.js';
import {env} from '@xenova/transformers';

env.localModelPath = `${fishcakePath}/models/`;

export const embeddingFunction = new TransformersEmbeddingFunction({
	model: 'Xenova/bge-base-en-v1.5',
	quantized: false,
});
