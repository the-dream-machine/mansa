import {fs} from 'zx';
import {modelOutputFullPath} from './modelPath.js';

export const isEmbeddingModelInstalled = async () => {
	const result = await fs.exists(modelOutputFullPath);
	if (!result) {
		throw new Error('Model does not exist');
	}
	return;
};
