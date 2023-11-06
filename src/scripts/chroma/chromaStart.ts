import {$, sleep} from 'zx';
import {fishcakePath} from '../../utils/fishcakePath.js';

export const chromaStart = async () => {
	// Start chroma db
	await $`chroma run --path ${fishcakePath}/db --port 6969 &>/dev/null &`.quiet();
	await sleep(500);
	return true;
};
