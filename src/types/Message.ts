export interface Message {
	id: string;
	message: string;
	isUser?: boolean;
	isRetrievalRun?: boolean;
	isCreateFile?: boolean;
	isTool?: boolean;
	isAssistant?: boolean;
}
