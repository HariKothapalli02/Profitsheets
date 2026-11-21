import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop ensures every page route navigation (or route param change)
 * opens instantly from the very top (0, 0) before the browser paints,
 * completely eliminating scroll retention and delayed bottom-to-top scrolling.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    // 1. Tell browser not to restore previous scroll position on manual SPA navigation
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // 2. Instantly reset window and body scroll position to (0, 0)
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    } catch (e) {
      window.scrollTo(0, 0);
    }

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [pathname, search]);

  return null;
}

