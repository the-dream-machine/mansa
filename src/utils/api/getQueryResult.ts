import axios, {
	type AxiosError,
	type AxiosRequestConfig,
	type AxiosResponse,
} from 'axios';

interface Args {
	thread_id: string;
}

export const getQueryResult = async ({thread_id}: Args) => {
	const params = {thread_id};
	const config: AxiosRequestConfig = {
		method: 'GET',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/query-result',
		headers: {'Content-Type': 'application/json'},
		params,
	};

	try {
		const response: AxiosResponse<string> = await axios.request(config);
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
