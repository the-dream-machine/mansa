import axios, {type AxiosRequestConfig, type AxiosResponse} from 'axios';
import {type Run} from '../../types/Run.js';
import {type StepsSchema} from '../schema/Steps.js';
import {type Static} from '@sinclair/typebox';

export const fetchAllSteps = async ({thread_id}: Run) => {
	const data = JSON.stringify({thread_id});
	const config: AxiosRequestConfig = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/fetch-all-steps',
		headers: {'Content-Type': 'application/json'},
		data,
	};

	try {
		const response: AxiosResponse<Static<typeof StepsSchema>[]> =
			await axios.request(config);
		return response.data;
	} catch (error) {
		throw error;
	}
};
