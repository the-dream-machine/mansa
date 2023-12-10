import {fs} from 'zx';
import {manjaroRepositoryPath} from '../manjaroPath.js';
import {writeToFile} from '../writeToFile.js';
import {summarizeFile} from '../api/summarizeFile.js';
import type {FileMapItem} from '../../types/FileMapItem.js';
import {getRepositoryMap} from './getRepositoryMap.js';

interface Args {
	filePath: string;
}

export const updateRepositoryMap = async ({filePath}: Args) => {
	const fileMapItem = await summarizeFile({filePath});
	const repositoryMapFilePath = `${manjaroRepositoryPath}/map.json`;
	let updatedMap: FileMapItem[] = [];

	// If map file exists
	if (await fs.exists(repositoryMapFilePath)) {
		const savedFileMapItems = await getRepositoryMap();

		// Find the index of the existing item with the same filePath
		const existingFileIndex = savedFileMapItems.findIndex(
			item => item.filePath === fileMapItem.filePath,
		);

		// If an item with the same filePath exists, replace it
		if (existingFileIndex !== -1) {
			savedFileMapItems[existingFileIndex] = fileMapItem;
			updatedMap = savedFileMapItems;
		} else {
			// If no item with the same filePath exists, add the new item
			updatedMap = [...savedFileMapItems, fileMapItem];
		}
	} else {
		updatedMap = [fileMapItem];
	}

	await writeToFile({
		filePath: repositoryMapFilePath,
		fileContent: JSON.stringify(updatedMap),
	});
};
