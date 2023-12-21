import axios, {type AxiosError, type AxiosResponse} from 'axios';
import {type Run} from '../../types/Run.js';
import {apiUrl} from '../apiUrl.js';

interface Args {
	retrievalContext: string;
	libraryName: string;
	commandName: string;
}

export const sendAssistantCommand = async (args: Args) => {
	const data = JSON.stringify(args);
	const config = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/assistant-command`,
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
