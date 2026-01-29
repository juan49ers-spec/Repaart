import { useEffect } from 'react';

interface Metric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
}

type ReportHandler = (metric: Metric) => void;

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

export function useWebVitals(reportHandler?: ReportHandler) {
  useEffect(() => {
    let isMounted = true;

    const reportWebVital = (metric: Metric) => {
      if (!isMounted) return;

      // Log to console in development
      if (import.meta.env.DEV) {
        console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
      }

      // Call custom handler if provided
      if (reportHandler) {
        reportHandler(metric);
      }

      // Send to Vercel Analytics if in production
      if (import.meta.env.PROD && vitalsUrl) {
        const body = JSON.stringify({
          dsn: process.env.VERCEL_ANALYTICS_ID,
          id: metric.id,
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
        });

        const url = new URL(vitalsUrl);
        url.searchParams.append('dnt', '0');

        if (navigator.sendBeacon) {
          navigator.sendBeacon(url.toString(), body);
        } else {
          fetch(url.toString(), {
            body,
            method: 'POST',
            keepalive: true,
            credentials: 'omit',
          });
        }
      }
    };

    // Load web-vitals library dynamically
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      if (!isMounted) return;

      // Cumulative Layout Shift (CLS)
      onCLS(reportWebVital);

      // Interaction to Next Paint (INP) - replaces FID
      onINP(reportWebVital);

      // First Contentful Paint (FCP)
      onFCP(reportWebVital);

      // Largest Contentful Paint (LCP)
      onLCP(reportWebVital);

      // Time to First Byte (TTFB)
      onTTFB(reportWebVital);
    });

    return () => {
      isMounted = false;
    };
  }, [reportHandler]);
}

// Thresholds for Core Web Vitals (from web.dev)
export const WEB_VITAL_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint (ms)
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
} as const;

// Utility function to get rating
export function getVitalRating(
  name: keyof typeof WEB_VITAL_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = WEB_VITAL_THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Custom hook to track specific metrics
export function useVitalsTracker() {
  useWebVitals((metric) => {
    // Send to analytics service (e.g., Google Analytics, Sentry)
    if ((window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.value),
        custom_map: {
          metric_rating: metric.rating,
          metric_delta: metric.delta,
        },
      });
    }

    // Track performance in Sentry
    if ((window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: 'performance',
        message: `${metric.name}: ${metric.value}ms (${metric.rating})`,
        level: getVitalRating(
          metric.name as keyof typeof WEB_VITAL_THRESHOLDS,
          metric.value
        ) === 'poor'
          ? 'warning'
          : 'info',
        data: {
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
        },
      });
    }
  });
}
