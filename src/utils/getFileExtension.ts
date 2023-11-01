interface Args {
	filePath: string;
}

export const getFileExtension = ({filePath}: Args) => {
	const splitFilePath = filePath.split('.');
	const fileExtension = splitFilePath[splitFilePath.length - 1];

	return fileExtension ?? '';
};
