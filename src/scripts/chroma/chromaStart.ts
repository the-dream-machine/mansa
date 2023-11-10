import {$, sleep} from 'zx';
import {fishcakePath} from '../../utils/fishcakePath.js';

export const chromaStart = async () => {
	// Start chroma db
	await $`chroma run --path ${fishcakePath}/db --port 6969 &>/dev/null &`.quiet();
	await sleep(4000); // Gives DB enough time to boot up
	return true;
};
