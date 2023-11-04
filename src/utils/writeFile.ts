import {fs, path} from 'zx';

interface Args {
	filePath: string;
	fileContent: string;
}

export const writeFile = async ({filePath, fileContent}: Args) => {
	// Ensure the directory exists before writing the log file
	const dirname = path.dirname(filePath);
	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, {recursive: true});
	}

	return await fs.writeFile(filePath, fileContent);
};
