import { createContext, useContext, useState, useEffect } from 'react';

const BuddyContext = createContext(null);

export function BuddyProvider({ children }) {
  const [context, setContext] = useState({ listingId: null, listingTitle: null });
  return <BuddyContext.Provider value={{ context, setContext }}>{children}</BuddyContext.Provider>;
}

export function useBuddyContext() {
  const ctx = useContext(BuddyContext);
  if (!ctx) throw new Error('useBuddyContext must be used within BuddyProvider');
  return ctx;
}

// Call from a page's useEffect to tell BazaarBuddy what's currently in view.
// Automatically clears when the page unmounts.
export function useSetBuddyContext(listingId, listingTitle) {
  const { setContext } = useBuddyContext();
  useEffect(() => {
    setContext({ listingId: listingId || null, listingTitle: listingTitle || null });
    return () => setContext({ listingId: null, listingTitle: null });
  }, [listingId, listingTitle, setContext]);
}
