export interface CreateFileToolParams {
	file_path: string;
	file_content: string;
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
