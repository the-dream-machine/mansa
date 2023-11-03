import {$, sleep} from 'zx';
import {fishcakePath} from '../../utils/userPath.js';
import {chromaStop} from './chromaStop.js';

export const chromaStart = async () => {
	// Shutdown any running instances
	await chromaStop();

	// Start chroma db
	await $`chroma run --path ${fishcakePath}/db --port 6969 &>/dev/null &`.quiet();
	await sleep(500);
	return true;
};
