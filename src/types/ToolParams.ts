export interface CreateFileToolParams {
	filePath: string;
	fileContent: string;
}

export interface ReadFileToolParams {
	filePath: string;
}

export interface EditFileToolParams {
	filePath: string;
	fileContent: string;
}

export interface RunCommandToolParams {
	command: string;
}
