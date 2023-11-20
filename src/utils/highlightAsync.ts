import {highlight} from 'prismjs-terminal';
import {defaultTheme} from './prismThemes.js';

interface Args {
	code: string;
	language?: string;
}

export const highlightAsync = ({code, language}: Args) => {
	return new Promise((resolve, reject) => {
		try {
			const result = highlight(code, {
				language,
				theme: defaultTheme,
			});
			resolve(result);
		} catch (error) {
			reject(error);
		}
	});
};
