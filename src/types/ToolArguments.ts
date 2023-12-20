export interface FindFileByPathToolArguments {
	file_path: string;
}

export interface CreateFileToolArguments {
	title: string;
	description: string;
	file_path: string;
	file_extension: string;
	file_content: string;
}

export interface ReadFileToolArguments {
	reason: string;
	file_path: string;
}

export interface EditFileToolArguments {
	title: string;
	description: string;
	file_path: string;
	file_extension: string;
	file_content: string;
}

export interface RunCommandToolArguments {
	title: string;
	description: string;
	command: string;
}

export interface UserSelectToolArguments {
	title: string;
	question: string;
	options: string[];
}

export interface UserInputTooArguments {
	title: string;
	question: string;
	placeholder: string;
}

export interface UserExplainToolArguments {
	title: string;
	explanation: string;
}

export interface UserActionToolArguments {
	title: string;
	instructions: string;
	action_item: string;
}

export type ToolArguments =
	| FindFileByPathToolArguments
	| ReadFileToolArguments
	| CreateFileToolArguments
	| EditFileToolArguments
	| RunCommandToolArguments
	| UserSelectToolArguments
	| UserInputTooArguments
	| UserExplainToolArguments
	| UserActionToolArguments;
