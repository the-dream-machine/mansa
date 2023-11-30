import axios, {type AxiosResponse} from 'axios';
import {type Run} from '../../types/Run.js';

interface Args {
	query: string;
	systemInstructions: string;
}

export const sendQuery = async ({query, systemInstructions}: Args) => {
	const data = JSON.stringify({query, systemInstructions});
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
		throw error;
	}
};
