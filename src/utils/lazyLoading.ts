import React, { lazy, Suspense } from 'react';

export const lazyWithPreload = (componentPath: string) => {
    const Component = lazy(() => import(componentPath));
    const preload = () => {
        import(componentPath);
    };
    return { Component, preload };
};

export const LazySkeleton = () => {
    return React.createElement('div', {
        style: { height: '200px', width: '100%' },
        className: 'animate-pulse bg-slate-200 rounded-lg',
        'aria-label': 'Loading...'
    });
};

export const LazyWrapper = (props: any) => {
    const { component, fallback } = props;
    return React.createElement(
        Suspense,
        { fallback: fallback || React.createElement(LazySkeleton, null) },
        React.createElement(component, null)
    );
};

export default { lazyWithPreload, LazySkeleton, LazyWrapper };