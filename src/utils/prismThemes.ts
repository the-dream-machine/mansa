import type {Theme} from 'prismjs-terminal';
import chalk from 'chalk';
import {Colors} from '../components/Colors.js';

export const bashDark: Theme = {
	function: [chalk.hex(Colors.LightYellow).bold],
};
