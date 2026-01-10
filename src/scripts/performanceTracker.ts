export interface PerformanceMetrics {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
    navigation: {
        ttfb: number; // Time to First Byte
        domLoad: number; // DOM Content Loaded
        windowLoad: number; // Full Page Load
        lcp?: number; // Largest Contentful Paint (estimated)
    };
    resources: ResourceMetric[];
}

export interface ResourceMetric {
    name: string;
    type: string;
    duration: number;
    size?: number;
}

/**
 * Obtiene métricas de memoria (si están disponibles en Chrome)
 */
export function getMemoryMetrics() {
    if ((performance as any).memory) {
        const mem = (performance as any).memory;
        return {
            usedJSHeapSize: Math.round(mem.usedJSHeapSize / 1024 / 1024),
            totalJSHeapSize: Math.round(mem.totalJSHeapSize / 1024 / 1024),
            jsHeapSizeLimit: Math.round(mem.jsHeapSizeLimit / 1024 / 1024),
        };
    }
    return undefined;
}

/**
 * Obtiene métricas de navegación (Page Load)
 */
export function getNavigationMetrics() {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (!navEntry) return {
        ttfb: 0,
        domLoad: 0,
        windowLoad: 0
    };

    return {
        ttfb: Math.round(navEntry.responseStart - navEntry.requestStart),
        domLoad: Math.round(navEntry.domContentLoadedEventEnd),
        windowLoad: Math.round(navEntry.loadEventEnd),
    };
}

/**
 * Obtiene los recursos más lentos cargados
 */
export function getSlowestResources(limit = 10): ResourceMetric[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    return resources
        .sort((a, b) => b.duration - a.duration)
        .slice(0, limit)
        .map(r => ({
            name: r.name.substring(r.name.lastIndexOf('/') + 1) || r.name, // Solo nombre de archivo si es posible
            type: r.initiatorType,
            duration: Math.round(r.duration),
            size: r.transferSize ? Math.round(r.transferSize / 1024) : undefined // KB
        }));
}

/**
 * Obtiene un resumen completo del rendimiento actual
 */
export function getPerformanceSnapshot(): PerformanceMetrics {
    return {
        memory: getMemoryMetrics(),
        navigation: getNavigationMetrics(),
        resources: getSlowestResources(20)
    };
}
