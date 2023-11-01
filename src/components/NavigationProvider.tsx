import React, {createContext, useContext, useState} from 'react';

type Page = 'installDatabase' | 'installEmbeddingModel' | 'indexFiles';

interface NavigationContext {
	activePage: Page;
	navigate: (page: Page) => void;
}

// Create a context for navigation
const NavigationContext = createContext<NavigationContext | null>(null);

export const NavigationProvider = ({children}: {children: React.ReactNode}) => {
	const [activePage, setActivePage] = useState<Page>('installDatabase');

	const navigate = (page: Page) => {
		setActivePage(page);
	};

	return (
		<NavigationContext.Provider value={{activePage, navigate}}>
			{children}
		</NavigationContext.Provider>
	);
};

export const useNavigation = () => {
	return useContext(NavigationContext);
};
