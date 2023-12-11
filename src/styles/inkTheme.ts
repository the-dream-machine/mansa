import {defaultTheme, extendTheme} from '@inkjs/ui';
import type {ColorName} from 'chalk';
import type {BoxProps, TextProps} from 'ink';
import {Colors} from './Colors.js';

interface SelectState {
	isFocused: boolean;
	isSelected: boolean;
}

export const inkTheme = extendTheme(defaultTheme, {
	components: {
		Spinner: {
			styles: {
				frame: (): TextProps => ({
					color: Colors.LightYellow,
				}),
			},
		},
		Select: {
			styles: {
				focusIndicator: (): TextProps => ({
					color: Colors.LightGreen,
				}),
				label: ({isFocused}: SelectState): TextProps => {
					let color: Colors = Colors.LightGray;

					if (isFocused) {
						color = Colors.LightGreen;
					}

					return {color};
				},
			},
		},
		MultiSelect: {
			styles: {
				focusIndicator: (): TextProps => ({
					color: Colors.LightPink,
				}),
				label: ({isFocused, isSelected}: SelectState): TextProps => {
					let color: ColorName = 'gray';

					if (isSelected) {
						color = 'white';
					}
					if (isFocused) {
						color = 'bgGray';
					}
					if (isFocused && isSelected) {
						color = 'bgMagenta';
					}

					return {
						color,
					};
				},
				selectedIndicator: (): TextProps => ({
					color: 'white',
				}),
				container: (): BoxProps => ({
					flexDirection: 'column',
				}),
				highlightedText: (): TextProps => ({
					color: 'yellow',
				}),
			},
		},
		TextInput: {
			styles: {
				// value: (): TextProps => ({
				// 	color: Colors.White,
				// }),
				// placeholder: (): TextProps => ({
				// 	color: Colors.DarkGray,
				// }),
			},
		},
		ProgressBar: {
			styles: {
				completed: () => ({
					color: Colors.DarkGreen,
				}),
			},
		},
	},
});
