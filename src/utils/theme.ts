import {defaultTheme, extendTheme} from '@inkjs/ui';
import type {ColorName} from 'chalk';
import type {BoxProps, TextProps} from 'ink';

export const theme = extendTheme(defaultTheme, {
	components: {
		Spinner: {
			styles: {
				frame: (): TextProps => ({
					color: 'yellowBright',
				}),
			},
		},
		MultiSelect: {
			styles: {
				focusIndicator: (): TextProps => ({
					color: 'magenta',
				}),

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				label: ({isFocused, isSelected}: any): TextProps => {
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
					color: 'white',
				}),
			},
		},
	},
});
