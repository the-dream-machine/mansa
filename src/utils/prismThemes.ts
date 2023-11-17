import type {Theme} from 'prismjs-terminal';
import chalk from 'chalk';

export const defaultTheme: Theme = {
	// default style
	_: chalk.hex('#76d9e6'),
	'namespace, lineNumber': chalk.dim,
	'comment, prolog, doctype, cdata': chalk.hex('#6f705e'),
	'operator, boolean, number': chalk.hex('#a77afe'),
	'attr-name, string, entity, url, language-css string, style string, tag attr-value':
		chalk.hex('#e6d06c'),
	'selector, inserted, tag attr-name': chalk.hex('#a6e22d'),
	'atrule, attr-value, keyword, important, deleted, tag': chalk.hex('#ef3b7d'),
	'regex, statement, style, script, script keyword': chalk.hex('#76d9e6'),
	'placeholder, variable': chalk.hex('#fff'),
	'important, statement, bold': chalk.bold,
	punctuation: chalk.hex('#bebec5'),
	italic: chalk.italic,
};
