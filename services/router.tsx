import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface RouterContextType {
  path: string;
  navigate: (path: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

export const RouterProvider = ({ children }: { children?: ReactNode }) => {
  const [path, setPath] = useState('/');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // remove #
      setPath(hash || '/');
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newPath: string) => {
    window.location.hash = newPath;
  };

  // Extract params (simple implementation for /tool/:id style)
  // Not full regex matching, just simple splitting for this app
  const params: Record<string, string> = {};
  if (path.startsWith('/tool/')) {
    const parts = path.split('/');
    if (parts[2]) params.id = parts[2];
  } else if (path.startsWith('/category/')) {
    const parts = path.split('/');
    if (parts[2]) params.id = parts[2];
  }

  return (
    <RouterContext.Provider value={{ path, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
};