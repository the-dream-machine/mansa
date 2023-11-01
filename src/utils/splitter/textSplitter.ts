import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';

interface Args {
	text: string;
	chunkSize: number;
}

export const textSplitter = async ({text, chunkSize}: Args) => {
	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize,
		chunkOverlap: 1,
	});

	const documents = await splitter.createDocuments([text]);
	return documents.map(doc => doc.pageContent);
};
