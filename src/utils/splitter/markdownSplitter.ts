import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';

interface Args {
	markdown: string;
	chunkSize: number;
}

export const markdownSplitter = async ({markdown, chunkSize}: Args) => {
	const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
		chunkSize,
		chunkOverlap: 0,
	});

	const documents = await splitter.createDocuments([markdown]);
	return documents.map(doc => doc.pageContent);
};
