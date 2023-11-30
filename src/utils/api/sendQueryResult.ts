import axios, {type AxiosRequestConfig, type AxiosResponse} from 'axios';

interface Args {
	thread_id: string;
	responseParentKey: string;
}

export const sendQueryResult = async ({thread_id, responseParentKey}: Args) => {
	const data = JSON.stringify({thread_id, responseParentKey});
	const config: AxiosRequestConfig = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/query-result',
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
