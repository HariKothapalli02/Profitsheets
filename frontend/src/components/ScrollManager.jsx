import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';

/**
 * ScrollManager:
 * 1. Global Scroll Progress Bar at the top of the viewport.
 * 2. Automated IntersectionObserver that activates `.revealed` on all `.reveal-init`
 *    and `.reveal-scale-init` elements across every page.
 * 3. Floating smooth "Scroll to top" pill for effortless navigation through deep reports.
 */
export default function ScrollManager() {
  const location = useLocation();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 1. Observe Scroll Position for Progress Bar & Scroll-To-Top Button
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentScroll = window.scrollY || window.pageYOffset;

          if (totalHeight > 0) {
            const progress = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
            setScrollProgress(progress);
          } else {
            setScrollProgress(0);
          }

          setShowScrollTop(currentScroll > 420);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // 2. IntersectionObserver + MutationObserver to Reveal Elements Smoothly on Scroll & Async Loads
  useEffect(() => {
    // If reduced motion is preferred, reveal everything immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal-init, .reveal-scale-init').forEach((el) => {
        el.classList.add('revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px'
      }
    );

    const checkAndObserve = () => {
      const elements = document.querySelectorAll('.reveal-init:not(.revealed), .reveal-scale-init:not(.revealed)');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // If element is already in viewport on load/render, reveal immediately
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('revealed');
        } else {
          observer.observe(el);
        }
      });
    };

    // Run immediately
    checkAndObserve();

    // Check after short delays to catch fast API responses
    const t1 = setTimeout(checkAndObserve, 100);
    const t2 = setTimeout(checkAndObserve, 350);
    const t3 = setTimeout(checkAndObserve, 800);

    // Watch for new DOM nodes inserted dynamically (e.g. after async fetch)
    const mutationObserver = new MutationObserver(() => {
      checkAndObserve();
    });

    if (document.body) {
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Safety fallback: reveal all elements after 1.5s so nothing can ever get stuck hidden
    const safetyTimer = setTimeout(() => {
      document.querySelectorAll('.reveal-init:not(.revealed), .reveal-scale-init:not(.revealed)').forEach((el) => {
        el.classList.add('revealed');
      });
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(safetyTimer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);

  const scrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  };

  return (
    <>
      {/* Subtle 2px Top Scroll Reading Bar */}
      <div 
        className="fixed top-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 z-[99999] pointer-events-none transition-all duration-75 ease-out"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* Floating Smooth Scroll-To-Top Pill */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top of page"
          className="fixed bottom-28 md:bottom-6 right-4 sm:right-6 z-40 bg-white/95 hover:bg-white text-slate-800 hover:text-emerald-700 text-xs font-semibold px-3 py-2 rounded-full shadow-md border border-slate-200/90 flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2"
        >
          <ChevronUp className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Top</span>
        </button>
      )}
    </>
  );
}
