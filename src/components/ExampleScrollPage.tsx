import {Box, Text} from 'ink';
import React from 'react';
import {ScrollArea} from './ScrollArea.js';
import {useStdoutDimensions} from '../utils/useStdDimensions.js';

export const ExampleScrollPage = () => {
	return (
		<ScrollArea>
			{Array.from({length: 20})
				.fill(true)
				.map((_, index) => (
					<Box
						key={index}
						flexShrink={0}
						borderStyle="single"
						flexDirection="column"
					>
						<Text>Item #{index + 1}</Text>
						{/* <Text>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et
							arcu in elit viverra laoreet ut in lacus. Vestibulum vel venenatis
							lorem. Nam id dui vitae elit efficitur scelerisque sed in erat.
							Mauris non placerat tellus, non cursus nulla. Nam id magna nisi.
							Duis auctor, sapien sit amet cursus eleifend, lectus lacus
							imperdiet enim, a interdum nisl ante ac mauris. Morbi sit amet
							lectus quis purus pellentesque tristique. Pellentesque ut placerat
							orci. Integer volutpat dui ut fringilla aliquam. Proin placerat
							imperdiet justo et maximus. Suspendisse eget euismod magna. Fusce
							justo ligula, finibus eu mollis eu, eleifend in lorem. Duis
							maximus, justo ut placerat blandit, ex dui gravida nisi, in
							egestas lorem lacus eu lectus. Maecenas eros urna, vulputate eu
							tortor in, pretium semper orci. Interdum et malesuada fames ac
							ante ipsum primis in faucibus. Quisque facilisis nisi vitae libero
							malesuada, sit amet egestas nisi vestibulum. Phasellus nec velit
							luctus ligula rutrum euismod ut nec elit. Morbi luctus odio in
							arcu ullamcorper pulvinar. Donec volutpat lectus suscipit,
							vulputate sapien et, mollis elit. Mauris vestibulum, quam eu
							facilisis luctus, eros lorem porttitor libero, eu euismod ligula
							risus et urna. Lorem ipsum dolor sit amet, consectetur adipiscing
							elit. Pellentesque semper ligula eget lobortis sagittis.
							Suspendisse quis blandit lacus. Pellentesque efficitur augue
							gravida consequat volutpat. Ut rutrum magna justo, id feugiat
							libero feugiat ut. Cras ornare, sem eu rutrum efficitur, ipsum
							odio gravida lacus, a tristique urna metus at justo. Etiam finibus
							lorem et purus sagittis elementum. Maecenas vitae malesuada metus.
							Pellentesque auctor non arcu ac facilisis. Morbi congue, diam nec
							posuere imperdiet, ligula ex lacinia ipsum, sit amet blandit nibh
							libero facilisis risus. Praesent at elit finibus, sollicitudin
							sapien ut, sollicitudin odio. Class aptent taciti sociosqu ad
							litora torquent per conubia nostra, per inceptos himenaeos. Nam ut
							turpis eget orci fringilla bibendum. Nunc vel mauris a nunc
							ultrices convallis. Proin et placerat lorem. Integer malesuada
							sapien tellus, non pharetra justo ultricies at. Morbi ut massa at
							dolor cursus efficitur. Phasellus sapien quam, efficitur finibus
							eros sed, posuere ullamcorper est. Etiam quis lorem sit amet lorem
							congue feugiat vitae facilisis justo. Vivamus auctor sapien vel
							diam feugiat vestibulum. Fusce aliquam purus ultrices risus
							sagittis vestibulum. Nullam tincidunt diam ut ligula bibendum, in
							elementum risus elementum. Nunc sed faucibus massa. Vivamus libero
							eros, ullamcorper ut purus iaculis, condimentum faucibus sapien.
							Nulla vel nibh dolor. Curabitur lobortis tristique nulla,
							vulputate vehicula ligula interdum eget. Fusce vel aliquet libero.
							Duis et tincidunt urna, in dapibus mi. Cras est nunc, posuere at
							eros ac, rhoncus facilisis nibh. Sed congue posuere malesuada. Sed
							condimentum mollis fringilla. Ut quam nunc, ultrices non tortor
							at, pellentesque porttitor dolor. Aenean eu laoreet lacus, sit
							amet interdum tellus. Pellentesque habitant morbi tristique
							senectus et netus et malesuada fames ac turpis egestas.
						</Text> */}
					</Box>
				))}
		</ScrollArea>
	);
};
