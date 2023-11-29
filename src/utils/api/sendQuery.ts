import axios, {type AxiosResponse} from 'axios';

import {type Run} from '../../types/Run.js';

interface Args {
	query: string;
}

export const sendQuery = async ({query}: Args) => {
	const config = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/send-query',
		headers: {'Content-Type': 'application/json'},
		data: query,
	};

	try {
		const response: AxiosResponse<Run> = await axios.request(config);
		return response.data;
	} catch (error) {
		throw error;
	}
};
