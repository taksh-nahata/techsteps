import { useEffect, useCallback } from 'react';

interface PerformanceConfig {
  enableImageLazyLoading?: boolean;
  enableResourceHints?: boolean;
  enableServiceWorker?: boolean;
  criticalResourceTimeout?: number;
}

export const usePerformanceOptimization = (config: PerformanceConfig = {}) => {
  const {
    enableImageLazyLoading = true,
    enableResourceHints = true,
    enableServiceWorker = true,
    criticalResourceTimeout = 1500
  } = config;

  // Preload critical resources
  const preloadResource = useCallback((href: string, as: string, crossorigin?: boolean) => {
    if (!enableResourceHints) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }, [enableResourceHints]);

  // Lazy load images
  const setupImageLazyLoading = useCallback(() => {
    if (!enableImageLazyLoading || !('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });

    return () => imageObserver.disconnect();
  }, [enableImageLazyLoading]);

  // Monitor Core Web Vitals
  const monitorWebVitals = useCallback(() => {
    // Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry.startTime > criticalResourceTimeout) {
        console.warn(`LCP exceeded target: ${lastEntry.startTime}ms > ${criticalResourceTimeout}ms`);
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // LCP not supported
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const eventEntry = entry as PerformanceEventTiming;
        if (eventEntry.processingStart - eventEntry.startTime > 100) {
          console.warn(`High FID detected: ${eventEntry.processingStart - eventEntry.startTime}ms`);
        }
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch {
      // FID not supported
    }

    return () => {
      observer.disconnect();
      fidObserver.disconnect();
    };
  }, [criticalResourceTimeout]);

  // Register service worker for caching
  const registerServiceWorker = useCallback(async () => {
    if (!enableServiceWorker || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }, [enableServiceWorker]);

  // Optimize font loading
  const optimizeFontLoading = useCallback(() => {
    // Use font-display: swap for better performance
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Reduce layout shifts
  const preventLayoutShifts = useCallback(() => {
    // Add aspect ratio containers for images and videos
    const style = document.createElement('style');
    style.textContent = `
      .aspect-ratio-container {
        position: relative;
        width: 100%;
        height: 0;
      }
      .aspect-ratio-container > * {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    // Initialize optimizations
    const imageCleanup = setupImageLazyLoading();
    if (imageCleanup) cleanupFunctions.push(imageCleanup);

    const vitalsCleanup = monitorWebVitals();
    if (vitalsCleanup) cleanupFunctions.push(vitalsCleanup);

    registerServiceWorker();
    optimizeFontLoading();
    preventLayoutShifts();

    // Preload critical resources
    preloadResource('/favicon.svg', 'image');

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [
    setupImageLazyLoading,
    monitorWebVitals,
    registerServiceWorker,
    optimizeFontLoading,
    preventLayoutShifts,
    preloadResource
  ]);

  return {
    preloadResource,
    setupImageLazyLoading,
    monitorWebVitals
  };
};