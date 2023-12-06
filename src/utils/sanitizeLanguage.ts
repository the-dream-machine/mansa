export const sanitizeLanguage = (extension: string) => {
	if (extension === ('mjs' || 'cjs')) {
		return 'js';
	} else {
		return extension;
	}
};
