import {ChromaClient} from 'chromadb';

export const chroma = new ChromaClient({
	path: 'http://localhost:6969',
});
