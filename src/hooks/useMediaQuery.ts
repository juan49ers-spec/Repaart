import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
    // Initialize lazily to avoid effect update
    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    const [prevQuery, setPrevQuery] = useState(query);
    if (query !== prevQuery) {
        setPrevQuery(query);
        const nextMatches = typeof window !== 'undefined' ? window.matchMedia(query).matches : false;
        if (nextMatches !== matches) {
            setMatches(nextMatches);
        }
    }

    useEffect(() => {
        const media = window.matchMedia(query);

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
};
