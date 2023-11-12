import {fs} from 'zx';
import {fishcakeRepoPath} from './fishcakePath.js';
import {writeFile} from './writeFile.js';
import {summarizeFile} from './summarizeFile.js';
import type {FileMapItem} from '../types/FileMapItem.js';
import {getRepositoryMap} from './getRepositoryMap.js';

interface Args {
	filePath: string;
}

export const updateRepositoryMap = async ({filePath}: Args) => {
	const fileMapItem = await summarizeFile({filePath});
	const repositoryMapFilePath = `${fishcakeRepoPath}/map.json`;
	let updatedMap: FileMapItem[] = [];

	if (await fs.exists(repositoryMapFilePath)) {
		const savedFileMapItems = await getRepositoryMap();
		updatedMap = [...savedFileMapItems, fileMapItem];
	} else {
		updatedMap = [fileMapItem];
	}

	await writeFile({
		filePath: repositoryMapFilePath,
		fileContent: JSON.stringify(updatedMap),
	});
};
