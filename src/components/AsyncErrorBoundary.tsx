import React, { Component, ErrorInfo } from 'react';
import { ErrorLogger } from '../services/errorLogger';
import { DefaultErrorUI } from './DefaultErrorUI';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetOnError?: boolean;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string | null;
}

export class AsyncErrorBoundary extends Component<
    ErrorBoundaryProps & {
        promise: Promise<unknown>;
    },
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps & { promise: Promise<unknown> }) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
        };

        props.promise.catch((error) => {
            this.setState({
                hasError: true,
                error,
                errorInfo: null,
                errorId: `async-err-${Date.now()}`,
            });
        });
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const errorId = `async-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        this.setState({
            error,
            errorInfo,
            errorId,
        });

        console.group('❌ Async Error Boundary Caught Error');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Error ID:', errorId);
        console.groupEnd();

        ErrorLogger.logError(error, {
            context: {
                componentStack: errorInfo.componentStack,
                asyncErrorBoundary: true,
                errorId,
            },
            tags: {
                asyncErrorBoundary: 'true',
                errorId,
            },
        });

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        const { hasError, error, errorId } = this.state;
        const { children, fallback } = this.props;

        if (hasError) {
            if (fallback) {
                return fallback;
            }
            return <DefaultErrorUI error={error} errorId={errorId} onReset={() => { }} />;
        }

        return children;
    }
}
