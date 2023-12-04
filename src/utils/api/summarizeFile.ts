import axios, {type AxiosResponse} from 'axios';
import {fs} from 'zx';
import type {FileMapItem} from '../../types/FileMapItem.js';

interface Args {
	filePath: string;
}

export const summarizeFile = async ({filePath}: Args) => {
	const fileContent = (await fs.readFile(filePath)).toString();
	const data = JSON.stringify({filePath, fileContent});
	const config = {
		method: 'post',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/summarize-file',
		headers: {'Content-Type': 'application/json'},
		data,
	};

	try {
		const response: AxiosResponse<FileMapItem> = await axios.request(config);
		return response.data;
	} catch (error) {
		throw error;
	}
};
