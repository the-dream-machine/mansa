import axios, {type AxiosRequestConfig, type AxiosResponse} from 'axios';
import {type Run} from '../../types/Run.js';

export const sendQueryResult = async ({thread_id}: Run) => {
	const data = JSON.stringify({thread_id});
	const config: AxiosRequestConfig = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/send-query-result',
		headers: {'Content-Type': 'application/json'},
		data,
	};

	try {
		const response: AxiosResponse = await axios.request(config);
		return JSON.stringify(response.data);
	} catch (error) {
		throw error;
	}
};
