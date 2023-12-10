import axios, {type AxiosRequestConfig, type AxiosResponse} from 'axios';
import {type RunStatusResponse, type Run} from '../../types/Run.js';

export const getQueryStatus = async ({run_id, thread_id}: Run) => {
	const data = JSON.stringify({
		run_id,
		thread_id,
	});

	const config: AxiosRequestConfig = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/query-status',
		headers: {'Content-Type': 'application/json'},
		data,
	};

	try {
		const response: AxiosResponse<RunStatusResponse> =
			await axios.request(config);
		return response.data;
	} catch (error) {
		throw error;
	}
};
