import {$, sleep} from 'zx';
import {fishcakePath} from '../../utils/userPath.js';

export const chromaStart = async () => {
	try {
		// Create .fishcake local dir
		await $`
	echo Adding .fishcake directory to .gitignore

	# Define the words you want to add to .gitignore
	header="# 🍥 fishcake"
	firstItem=".fishcake"

	# Check if .gitignore exists
	if [ -f .gitignore ]; then

		# Check if the words are already in .gitignore
		if grep -q "$header" .gitignore && grep -q "$firstItem" .gitignore; then
			echo "Already Exists"
		else
			# If the words are not in .gitignore, add them to the file with a leading line break
			echo -e "\n\n$header\n$firstItem" >> .gitignore
			echo "Added both words to .gitignore."
		fi
	else
		# If .gitignore doesn't exist, create it and add the words without a leading line break
		echo -e "$header\n$firstItem" > .gitignore
		echo ".gitignore created with both words."
	fi`.quiet();

		// Start chroma db
		await $`chroma run --path ${fishcakePath}/db --port 6969 &>/dev/null &`.quiet();
		await sleep(8000);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};
