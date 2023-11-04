import {chroma} from '../utils/chroma.js';
import {getRepoConfig} from './getRepoConfig.js';

export const isRepoIndexed = async () => {
	const repoConfig = await getRepoConfig();
	return await chroma.getCollection({name: repoConfig.repo});
};
