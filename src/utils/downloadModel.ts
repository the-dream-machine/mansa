import {fs} from 'zx';
import axios, {type AxiosResponse} from 'axios';
import type {Sender} from 'xstate';

import {fishcakeUserPath} from './fishcakePath.js';
import {
	DownloadModelEvent,
	type DownloadModelMachineEvent,
} from '../machines/downloadModelMachine.js';

const outputDirectory = `${fishcakeUserPath}/models/Xenova/bge-base-en-v1.5/onnx`;
const filename = 'model.onnx';

export const downloadModel = async (
	callback: Sender<DownloadModelMachineEvent>,
) => {
	// Ensure the output directory exists or create it
	if (!fs.existsSync(outputDirectory)) {
		fs.mkdirSync(outputDirectory, {recursive: true});
	}

	const response: AxiosResponse<fs.ReadStream> = await axios({
		method: 'GET',
		url: 'https://huggingface.co/Xenova/bge-base-en-v1.5/resolve/main/onnx/model.onnx',
		responseType: 'stream',
	});

	const writeStream = fs.createWriteStream(`${outputDirectory}/${filename}`);
	const totalBytes = response.headers['content-length'];
	const startTime = performance.now();
	let downloadedBytes = 0;

	response.data.on('data', (chunk: Buffer) => {
		downloadedBytes += chunk.length;
		const endTime = performance.now();
		const elapsedSeconds = (endTime - startTime) / 1000;
		const speed = downloadedBytes / (1024 * elapsedSeconds);
		const progress = (downloadedBytes / totalBytes) * 100;

		callback({type: DownloadModelEvent.PROGRESS, data: {progress, speed}});
	});

	response.data.pipe(writeStream);

	const streamPromise = new Promise((resolve, reject) => {
		response.data.on('error', reject);
		writeStream.on('finish', resolve);
		writeStream.on('error', reject);
	});

	return await streamPromise;
};
