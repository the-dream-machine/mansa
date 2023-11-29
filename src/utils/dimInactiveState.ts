import {Colors, type BaseColors} from './Colors.js';

interface Args {
	color: Colors | BaseColors;
	condition: boolean;
}

export const dimInactiveStep = ({color, condition}: Args) =>
	condition ? Colors.DarkGray : color;
