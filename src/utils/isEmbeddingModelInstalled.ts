import {fs} from 'zx';
import {modelOutputFullPath} from './modelPath.js';

export const isEmbeddingModelInstalled = async () =>
	await fs.exists(modelOutputFullPath);
