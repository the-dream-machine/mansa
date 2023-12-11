import axios, {
	type AxiosError,
	type AxiosRequestConfig,
	type AxiosResponse,
} from 'axios';
import {type RunStatusResponse, type Run} from '../../types/Run.js';

export const getQueryStatus = async ({run_id, thread_id}: Run) => {
	const params = {run_id, thread_id};
	const config: AxiosRequestConfig = {
		method: 'GET',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/query-status',
		headers: {'Content-Type': 'application/json'},
		params,
	};

	try {
		const response: AxiosResponse<RunStatusResponse> =
			await axios.request(config);

		if (response.data.status === 'failed') {
			throw new Error(response.data.last_error?.message);
		}
		console.log('🌱 # getQueryStatus response.data:', response.data);
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const axiosError: AxiosError<string> = error;
			throw new Error(axiosError.response?.data);
		} else {
			throw error;
		}
	}
};
