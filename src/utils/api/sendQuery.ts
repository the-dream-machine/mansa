import axios, {AxiosError, type AxiosResponse} from 'axios';
import {type Run} from '../../types/Run.js';

interface Args {
	query: string;
	thread_id?: string;
}

export const sendQuery = async ({query, thread_id}: Args) => {
	const data = JSON.stringify({query, thread_id});
	const config = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/query',
		headers: {'Content-Type': 'application/json'},
		data,
	};

	try {
		const response: AxiosResponse<Run> = await axios.request(config);
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
