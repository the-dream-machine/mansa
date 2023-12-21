import axios, {type AxiosResponse} from 'axios';
import {type Run} from '../../types/Run.js';
import {type ToolOutput} from '../../types/Tool.js';
import {apiUrl} from '../apiUrl.js';

interface Args {
	run: Run;
	toolOutputs: ToolOutput[];
}

export const submitToolOutputs = async ({run, toolOutputs}: Args) => {
	const data = JSON.stringify({run, toolOutputs});
	const config = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/submit-tool-outputs`,
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
