export interface Message {
	id: string;
	text: string;
	isGetRepositorySummary?: boolean;
	isCreateFile?: boolean;
	isUser?: boolean;
	isRetrievalRun?: boolean;
	isTool?: boolean;
	isAssistant?: boolean;
}
