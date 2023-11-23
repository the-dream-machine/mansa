import {highlight} from 'prismjs-terminal';
import {ThemeOptions, defaultPrismTheme} from './prismThemes.js';

interface Args {
	code: string;
	language?: string;
	themeOptions?: ThemeOptions;
}

export const highlightAsync = ({code, language, themeOptions}: Args) => {
	return new Promise((resolve, reject) => {
		try {
			const result = highlight(code, {
				language,
				theme: defaultPrismTheme({...themeOptions}),
			});
			resolve(result);
		} catch (error) {
			reject(error);
		}
	});
};
