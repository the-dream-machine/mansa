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
	| 'create_file'
	| 'read_file'
	| 'edit_file'
	| 'run_command'
	| 'get_repository_metadata';

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
