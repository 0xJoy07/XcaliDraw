import { useEffect, useRef, useState } from 'react';

// Module-level singleton observer setup
type ScrollCallback = (isVisible: boolean) => void;
const observerCallbacks = new Map<Element, ScrollCallback>();

let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver() {
  if (typeof window === 'undefined') return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = observerCallbacks.get(entry.target);
          if (callback) {
            callback(true);
            // Unobserve immediately to ensure it only triggers once
            sharedObserver?.unobserve(entry.target);
            observerCallbacks.delete(entry.target);
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0,
    });
  }
  return sharedObserver;
}

export function useScrollReveal(delayMs = 0) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Fast path for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = getSharedObserver();
    if (observer) {
      observerCallbacks.set(el, setIsVisible);
      observer.observe(el);
    }

    return () => {
      observerCallbacks.delete(el);
      observer?.unobserve(el);
    };
  }, []);

  return {
    ref: elementRef,
    className: `reveal-base ${isVisible ? 'reveal-visible' : ''}`,
    style: { transitionDelay: `${delayMs}ms` }
  };
}
