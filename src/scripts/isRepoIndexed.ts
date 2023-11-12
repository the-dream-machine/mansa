import {getRepositoryChecksums} from '../utils/getRepositoryChecksums.js';
import {getRepositoryMap} from '../utils/getRepositoryMap.js';

export const isRepoIndexed = async () => ({
	checksums: await getRepositoryChecksums(),
	repositoryMap: await getRepositoryMap(),
});
