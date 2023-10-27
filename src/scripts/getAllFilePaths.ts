import {execa} from 'execa';
import {$, path} from 'zx';
// const referencedFile = require('./test');
// import * as foo from './test.sh';

const ignoreFolders = [
	'.fishcake',
	'.git',
	'.next',
	'node_modules',
	'dist',
	'public',
];

// function convertToNestedObject(paths: string[]) {
// 	const result = {};

// 	for (const path of paths) {
// 		const segments = path.split('/');

// 		// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 		let current: any = result;

// 		for (const segment of segments) {
// 			if (!current[segment]) {
// 				current[segment] = {};
// 				current[segment].type = 'folder';
// 			}

// 			current = current[segment];
// 		}

// 		current.type = 'file';
// 	}

// 	return result;
// }

function convertToNestedObject(paths: string[]) {
	const result = {};

	paths.forEach(path => {
		const parts = path.split('/');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let current: any = result;

		parts.forEach((part, index) => {
			if (part !== '') {
				// Check if the part is not an empty string
				if (!current[part]) {
					if (index === parts.length - 1) {
						current[part] = null; // Leaf node
					} else {
						current[part] = {}; // Non-leaf node
					}
				}
			}
			current = current[part];
		});
	});

	return result;
}

export const getAllFilePaths = async () => {
	const terminalOutput =
		await $`find . \\( -name "node_modules" -o -name ".git" -o -name ".next" -o -name ".fishcake" -o -name "public" \\) -prune -o -type f -print`.quiet();
	const paths = terminalOutput.stdout.trim().split('\n');

	return paths;
};

// export const getAllFilePaths = async () => {
// 	const currentDirectory = await $`ls`.quiet();
// 	const paths = currentDirectory.stdout.trim().split('\n');

// 	return paths;
// };
