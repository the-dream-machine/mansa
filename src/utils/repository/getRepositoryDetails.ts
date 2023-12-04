import {fs} from 'zx';
import {type Repo} from '../../types/Repo.js';

export const getRepositoryDetails = async (): Promise<Repo> =>
	await fs.readJson('./package.json');
