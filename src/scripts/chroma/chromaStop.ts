import {$} from 'zx';

export const chromaStop = async () => {
	try {
		// Gracefully shutdown process running on port 6969
		await $`lsof -t -i :6969 | xargs kill -15`.quiet();
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};
