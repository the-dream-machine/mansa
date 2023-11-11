import {fs} from 'zx';
import {fishcakeUserPath} from './fishcakePath.js';
import axios, {type AxiosResponse} from 'axios';

export const outputDirectory = `${fishcakeUserPath}/models/Xenova/bge-base-en-v1.5`;

export const downloadEmbeddingModelMetadata = async () => {
	// Ensure the output directory exists or create it
	if (!fs.existsSync(outputDirectory)) {
		fs.mkdirSync(outputDirectory, {recursive: true});
	}

	const metadataFileNames = [
		'config.json',
		'tokenizer.json',
		'tokenizer_config.json',
	];

	for (const metadataFileName of metadataFileNames) {
		const response: AxiosResponse<fs.ReadStream> = await axios({
			url: `https://huggingface.co/Xenova/bge-base-en-v1.5/resolve/main/${metadataFileName}`,
			method: 'get',
			responseType: 'stream',
		});

		const writeStream = fs.createWriteStream(
			`${outputDirectory}/${metadataFileName}`,
		);

		response.data.pipe(writeStream);

		const streamPromise = new Promise((resolve, reject) => {
			response.data.on('error', reject);
			writeStream.on('finish', resolve);
			writeStream.on('error', reject);
		});

		await streamPromise;
	}

	return;
};
