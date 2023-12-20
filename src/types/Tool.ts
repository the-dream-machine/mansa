export type ToolNames =
	| 'find_file_by_path'
	| 'read_file'
	| 'create_file'
	| 'edit_file'
	| 'run_command'
	| 'user_select'
	| 'user_input';

export interface ToolFunction {
	name: ToolNames;
	arguments: string;
}

export interface Tool {
	id: string;
	type: 'function';
	function: ToolFunction;
}

export interface ToolOutput {
	tool_call_id: string;
	output: string;
}
