import { useEffect, useRef } from 'react';

/**
 * Hook to observe individual ref elements
 */
export function useScrollFadeIn<T extends HTMLElement = HTMLDivElement>() {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);

    // Initial check
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add('is-visible');
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return elementRef;
}

/**
 * Automatically observes all elements with class .fade-in-scroll
 */
export function useGlobalScrollFadeIn() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    const observeAll = () => {
      const elements = document.querySelectorAll('.fade-in-scroll');
      elements.forEach((el) => {
        observer.observe(el);
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 30) {
          el.classList.add('is-visible');
        }
      });
    };

    observeAll();
    const timeout = setTimeout(observeAll, 200);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);
}
