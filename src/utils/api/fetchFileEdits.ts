import axios, {type AxiosRequestConfig, type AxiosResponse} from 'axios';
import {type Run} from '../../types/Run.js';

export const fetchFileEdits = async ({thread_id}: Run) => {
	const data = JSON.stringify({thread_id});
	const config: AxiosRequestConfig = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/fetch-file-edits',
		headers: {'Content-Type': 'application/json'},
		data,
	};

	try {
		const response: AxiosResponse<{editedFile: string}> =
			await axios.request(config);
		return response.data;
	} catch (error) {
		throw error;
	}
};
