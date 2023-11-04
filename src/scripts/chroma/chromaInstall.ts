import {$} from 'zx';

export const chromaInstall = async () =>
	await $`
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
		fi`.quiet();
