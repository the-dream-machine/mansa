import axios, {type AxiosResponse} from 'axios';
import {fs} from 'zx';
import type {FileMapItem} from '../../types/FileMapItem.js';

interface Args {
	filePath: string;
	fileContent: string;
	fileSummary: string;
}

export const generateFileEdits = async ({filePath, fileContent}: Args) => {
	const data = JSON.stringify({filePath, fileContent});
	const config = {
		method: 'post',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/generate-file-edits',
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
