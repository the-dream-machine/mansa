import {$} from 'zx';
import {fishcakePath} from '../../utils/userPath.js';
import {chromaStop} from './chromaStop.js';

export const chromaStart = async () => {
	try {
		await chromaStop();

		// Start chroma db
		await $`chroma run --path ${fishcakePath}/db --port 6969 &>/dev/null &`.quiet();
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};
