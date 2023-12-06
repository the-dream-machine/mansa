import {highlight} from 'prismjs-terminal';
import {type ThemeOptions, defaultPrismTheme} from './prismThemes.js';
import {sanitizeLanguage} from './sanitizeLanguage.js';

interface Args {
	code: string;
	language?: string;
	themeOptions?: ThemeOptions;
}

export const highlightAsync = ({code, language, themeOptions}: Args) => {
	const sanitizedLanguage = sanitizeLanguage(language ?? '');
	return new Promise((resolve, reject) => {
		try {
			const result = highlight(code, {
				language: sanitizedLanguage,
				theme: defaultPrismTheme({...themeOptions}),
			});
			resolve(result);
		} catch (error) {
			reject(error);
		}
	});
};
