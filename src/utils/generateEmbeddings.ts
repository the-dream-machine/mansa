import {pipeline, env, cos_sim} from '@xenova/transformers';

export const generateEmbeddings = async () => {
	const extractor = await pipeline(
		'feature-extraction',
		'Xenova/jina-embeddings-v2-base-en',
		{quantized: false},
	);

	const output = await extractor(
		['How is the weather today?', 'What is the weather like today?'],
		{pooling: 'mean'},
	);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	console.log(cos_sim(output[0].data, output[1].data));
};
