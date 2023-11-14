interface FilePathCreate {
	file_path: string;
	file_content_summary: string;
}
interface FilePathModify {
	file_path: string;
	file_modification_summary: string;
}

export interface Step {
	step_title: string;
	step_description: string;
	step_type: 'run_bash_command' | 'create_file' | 'modify_file';
	new_file_paths_to_create?: FilePathCreate[];
	existing_file_paths_to_modify?: FilePathModify[];
	bash_command_to_run?: string;
}
