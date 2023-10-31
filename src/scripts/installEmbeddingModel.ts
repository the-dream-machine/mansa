import {fs, path} from 'zx';
import {fishcakePath} from '../utils/userPath.js';
import axios from 'axios';

const url =
	'https://huggingface.co/Xenova/jina-embeddings-v2-base-en/resolve/main/onnx/model.onnx';
const outputDirectory = `${fishcakePath}/models/`;

// Ensure the output directory exists or create it
if (!fs.existsSync(outputDirectory)) {
	fs.mkdirSync(outputDirectory, {recursive: true});
}

const outputFilePath = path.join(
	outputDirectory,
	'jina-embeddings-v2-base-en.onnx',
);

const installEmbeddingModel = async () => {
	const writer = fs.createWriteStream(outputFilePath);
	let downloadedLength = 0;
	const startTime = performance.now();

	const response = await axios({
		method: 'get',
		url: url,
		responseType: 'stream',
	});

	const totalLength = response.headers['content-length'];

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
	response.data.on('data', (chunk: any) => {
		downloadedLength += chunk.length;

		const endTime = performance.now();
		const elapsedSeconds = (endTime - startTime) / 1000;
		const downloadSpeed = downloadedLength / (1024 * elapsedSeconds);
		const progress = (downloadedLength / totalLength) * 100;

		console.log(
			`Download progress: ${progress.toFixed(
				2,
			)}% - Download speed: ${downloadSpeed.toFixed(2)} KB/s`,
		);
	});

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	response.data.pipe(writer);

	return new Promise((resolve, reject) => {
		writer.on('finish', resolve);
		writer.on('error', reject);
	});
};

// installEmbeddingModel()
// 	.then(() => {
// 		console.log('Download completed successfully.');
// 	})
// 	.catch(error => {
// 		console.error('Download failed:', error);
// 	});
