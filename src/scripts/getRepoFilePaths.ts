import {fs, path} from 'zx';
import ignore from 'ignore';

const ignoreFileExtensions = [
	'*.min.js',
	'*.min.js.map',
	'*.min.css',
	'*.min.css.map',
	'*.tfstate',
	'*.tfstate.backup',
	'*.png',
	'*.jpg',
	'*.jpeg',
	'*.gif',
	'*.bmp',
	'*.tiff',
	'*.ico',
	'*.icns',
	'*.mp3',
	'*.wav',
	'*.wma',
	'*.ogg',
	'*.flac',
	'*.mp4',
	'*.avi',
	'*.mkv',
	'*.mov',
	'*.wmv',
	'*.m4a',
	'*.m4v',
	'*.3gp',
	'*.3g2',
	'*.rm',
	'*.swf',
	'*.flv',
	'*.iso',
	'*.bin',
	'*.tar',
	'*.zip',
	'*.7z',
	'*.gz',
	'*.rar',
	'*.pdf',
	'*.doc',
	'*.docx',
	'*.xls',
	'*.xlsx',
	'*.ppt',
	'*.pptx',
	'*.svg',
	'*.parquet',
	'*.pyc',
	'*.pub',
	'*.pem',
	'*.git',
	'*.lockb',
	'*.log',
	'*.lock',
	'.DS_Store',

	// Ignore package manager lock files
	'bun.lockb',
	'yarn.lock',
	'package-lock.json',
	'pnpm-lock.yaml',
];

const getFilesInDir = async (dirPath: string): Promise<string[]> => {
	let results: string[] = [];
	const list: string[] = await fs.promises.readdir(dirPath);

	// Load .gitignore and add additional ignore rules
	const gitignore = ignore
		.default()
		.add(
			[fs.readFileSync('.gitignore').toString(), ...ignoreFileExtensions].join(
				'\n',
			),
		);

	for (const file of list) {
		const filePath = path.join(dirPath, file);

		// Skip if the file is ignored
		if (gitignore.ignores(filePath)) {
			continue;
		}

		const stat: fs.Stats = await fs.promises.stat(filePath);

		if (stat && stat.isDirectory()) {
			/* Recurse into a subdirectory */
			results = results.concat(await getFilesInDir(filePath));
		} else {
			/* Is a file */
			results.push(filePath);
		}
	}

	return results;
};

export const getRepoFilePaths = async () => {
	const paths = await getFilesInDir('.');
	return paths;
};
