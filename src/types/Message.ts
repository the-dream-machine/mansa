export interface Message {
	id: string;
	text: string;
	isGetRepositorySummary?: boolean;
	isFindFileByPath?: boolean;
	isCreateFile?: boolean;
	isUser?: boolean;
	isRetrievalRun?: boolean;
	isTool?: boolean;
	isAssistant?: boolean;
}
