import {pipeline, env, cos_sim} from '@xenova/transformers';
import {fishcakePath} from './userPath.js';

env.localModelPath = `${fishcakePath}/models/`;
// env.allowRemoteModels = false;
env.cacheDir = `${fishcakePath}/cache/`;

export const generateEmbeddings = async () => {
	const extractor = await pipeline(
		'feature-extraction',
		'Xenova/bge-base-en-v1.5',
		{
			quantized: false,
		},
	);

	const output = await extractor(
		['How is the weather today?', 'What is the weather like today?'],
		{pooling: 'mean'},
	);
	console.log('🌱 # output:', output);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	console.log(cos_sim(output[0].data, output[1].data));
};
