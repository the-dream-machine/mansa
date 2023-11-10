import axios, {type AxiosResponse} from 'axios';
import {fs} from 'zx';

interface Args {
	filePath: string;
}

interface Response {
	filePath: string;
	fileSummary: string;
	relations: string[];
}

export const parseCodeFile = async ({filePath}: Args) => {
	const fileContent = (await fs.readFile(filePath)).toString();

	const data = JSON.stringify({filePath, fileContent});
	const config = {
		method: 'post',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/parse-code-file',
		headers: {'Content-Type': 'application/json'},
		data,
	};

	try {
		const response: AxiosResponse<Response> = await axios.request(config);
		return response.data;
	} catch (error) {
		throw new Error(`Error while trying to index ${filePath}`);
	}
};
