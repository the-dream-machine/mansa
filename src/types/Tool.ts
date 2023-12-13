export interface ToolFunction {
	name: string;
	description: string;
	parameters: Record<string, string>;
}

export interface Tool {
	type: 'function';
	function: ToolFunction;
}

export type ToolNames =
	| 'get_repository_summary'
	| 'find_file_by_path'
	| 'find_file_by_description'
	| 'read_file'
	| 'create_file'
	| 'edit_file';

export interface RequiredActionFunctionToolCallFunction {
	arguments: string;
	name: ToolNames;
}

export interface RequiredActionFunctionToolCall {
	id: string;
	type: 'function';
	function: RequiredActionFunctionToolCallFunction;
}

export interface SubmitToolOutputs {
	tool_calls: RequiredActionFunctionToolCall[];
}

export interface ToolOutput {
	tool_call_id: string;
	output: string;
}
