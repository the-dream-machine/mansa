import {$, fs, path} from 'zx';
import {v4 as uuid} from 'uuid';
import {fishcakePath} from '../../utils/userPath.js';

interface Result {
	status: boolean;
	errorLogFilePath?: string;
}

export const chromaInstall = async (): Promise<Result> => {
	let stdout = '';
	const errorLogFilePath = `${fishcakePath}/logs/install_db_error_${uuid()}.log`;

	try {
		const process = await $`
		package_name="chromadb"

		# Check if 'pip3' is installed
		if command -v pip3 >/dev/null 2>&1; then
		    # Install the package using 'pip3'
		    pip3 install $package_name
		    echo "Installed $package_name using the system's Python 3 version."
		elif command -v pip >/dev/null 2>&1; then
		    # If 'pip3' is not available, try 'pip' as a fallback
		    pip install $package_name
		    echo "Installed $package_name using the system's Python version (Python 2 or Python 3)."
		else
		    echo "Error: 'pip' and 'pip3' are not installed. Please install Python and 'pip' on your system."
		fi`.quiet();

		if (process.stdout.includes("Error: 'pip' and 'pip3' are not installed")) {
			stdout =
				"Error: 'pip' and 'pip3' are not installed. Please install Python and 'pip' on your system.";
			throw new Error("Error: 'pip' and 'pip3' are not installed");
		}

		return {status: true};
	} catch (error) {
		// Ensure the directory exists before writing the log file
		const dirname = path.dirname(errorLogFilePath);
		if (!fs.existsSync(dirname)) {
			fs.mkdirSync(dirname, {recursive: true});
		}
		await fs.writeFile(errorLogFilePath, stdout);

		return {status: false, errorLogFilePath};
	}
};
