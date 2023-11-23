import * as diff from 'diff';

interface Args {
	originalFile: string;
	newFile: string;
	lineOptions?: diff.LinesOptions;
}

export const getDiffsAsync = ({originalFile, newFile, lineOptions}: Args) => {
	return new Promise((resolve, reject) => {
		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			const diffs = diff.diffLines(originalFile, newFile, {
				...lineOptions,
			});
			resolve(diffs);
		} catch (error) {
			reject(error);
		}
	});
};
