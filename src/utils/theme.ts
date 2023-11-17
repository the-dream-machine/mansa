import {defaultTheme, extendTheme} from '@inkjs/ui';
import type {ColorName} from 'chalk';
import type {BoxProps, TextProps} from 'ink';
import {BaseColors, Colors} from '../components/Colors.js';

interface SelectState {
	isFocused: boolean;
	isSelected: boolean;
}

export const theme = extendTheme(defaultTheme, {
	components: {
		Spinner: {
			styles: {
				frame: (): TextProps => ({
					color: Colors.White,
				}),
			},
		},
		Select: {
			styles: {
				focusIndicator: (): TextProps => ({
					color: 'magentaBright',
				}),
				label: ({isFocused}: SelectState): TextProps => {
					let color: ColorName = 'gray';

					if (isFocused) {
						color = 'magentaBright';
					}

					return {color};
				},
			},
		},
		MultiSelect: {
			styles: {
				focusIndicator: (): TextProps => ({
					color: 'magenta',
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
				value: (): TextProps => ({
					color: 'yellow',
				}),
			},
		},
	},
});
