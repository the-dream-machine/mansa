export interface CreateFileToolParams {
	file_path: string;
	file_content: string;
}

export interface ReadFileToolParams {
	file_path: string;
}

export interface EditFileToolParams {
	file_path: string;
	file_content: string;
}

export interface FindFileByPathToolParams {
	file_path: string;
}
