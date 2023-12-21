import axios, {
	type AxiosError,
	type AxiosRequestConfig,
	type AxiosResponse,
} from 'axios';
import {type Library} from '../../types/Library.js';
import {apiUrl} from '../apiUrl.js';

interface Args {
	name: string;
}

export const getLibrary = async ({name}: Args) => {
	const params = {name};
	const config: AxiosRequestConfig = {
		method: 'GET',
		maxBodyLength: Infinity,
		url: `${apiUrl}/library`,
		headers: {'Content-Type': 'application/json'},
		params,
	};

	try {
		const response: AxiosResponse<Library> = await axios.request(config);
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
