import {$} from 'zx';

// Gracefully shutdown process running on port 6969
export const chromaStop = async () =>
	await $`lsof -t -i :6969 | xargs kill -15`.quiet();
