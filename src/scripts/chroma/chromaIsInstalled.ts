import {$} from 'zx';

export const chromaIsInstalled = async () => {
	try {
		await $`chroma --help`.quiet();
		return true;
	} catch (error) {
		return false;
	}
};
