export function useErrorHandler() {
    const reportError = (error: Error, context?: Record<string, unknown>) => {
        console.error('Manual error report:', error, context);

        // Send to Sentry
        const windowContext = window as unknown as { Sentry?: { captureException: (error: Error, options: unknown) => void } };
        if (typeof window !== 'undefined' && windowContext.Sentry) {
            windowContext.Sentry.captureException(error, {
                extra: context,
                tags: {
                    manual: true,
                },
            });
        }
    };

    return { reportError };
}
