export interface CodeDocument {
	id: string;
	chunks: string[];
	metadata: {
		filePath: string;
	};
}
