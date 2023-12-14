import axios, {type AxiosError, type AxiosResponse} from 'axios';
import {type Run} from '../../types/Run.js';

interface Args {
	commandName: string;
	libraryName: string;
	repositorySummary: string;
	packageManager: string;
}

export const sendRetrievalCommand = async (args: Args) => {
	const data = JSON.stringify(args);
	const config = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/retrieval-command',
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