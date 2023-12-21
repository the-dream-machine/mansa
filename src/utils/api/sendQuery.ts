import axios, {AxiosError, type AxiosResponse} from 'axios';
import {type Run} from '../../types/Run.js';
import {apiUrl} from '../apiUrl.js';

interface Args {
	query: string;
	isRetrievalRun: boolean;
	thread_id?: string;
	libraryId: string;
}

export const sendQuery = async ({
	query,
	thread_id,
	isRetrievalRun,
	libraryId,
}: Args) => {
	const data = JSON.stringify({query, thread_id, isRetrievalRun, libraryId});
	const config = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/query`,
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
