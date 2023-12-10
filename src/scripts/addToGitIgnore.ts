import {$} from 'zx';

export const addToGitIgnore = async () => {
	// Create .manjaro local dir
	const result = await $`
	# Define the words you want to add to .gitignore
	header="# manjaro"
	firstItem=".manjaro"

	# Check if .gitignore exists
	if [ -f .gitignore ]; then
		# Check if the words are already in .gitignore
		if grep -q "$header" .gitignore && grep -q "$firstItem" .gitignore  .gitignore; then
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

	return result.stdout;
};
