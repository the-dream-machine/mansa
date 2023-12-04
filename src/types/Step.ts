export enum StepType {
	RUN_BASH_COMMAND = 'RUN_BASH_COMMAND',
	CREATE_FILE = 'CREATE_FILE',
	MODIFY_FILE = 'MODIFY_FILE',
	USER_ACTION = 'USER_ACTION',
}

export interface Step {
	step_title: string;
	step_description: string;
	step_type: StepType;
	bash_command_to_run?: string;
	new_file_path_to_create?: {
		file_path: string;
		file_extension: string;
		file_content_summary: string;
		file_code_changes: string;
	};
	existing_file_path_to_modify?: {
		file_path: string;
		file_extension: string;
		current_file_content_summary: string;
		file_content_summary: string;
	};
}
