/**
 * Container Queries Helper Components
 *
 * These components make it easy to use container queries
 * without writing custom CSS for every use case.
 */

import React from 'react';

interface ContainerQueriesWrapperProps {
    children: React.ReactNode;
    className?: string;
    type?: 'inline-size' | 'normal' | 'size';
    style?: React.CSSProperties;
}

export const ContainerQueriesWrapper: React.FC<ContainerQueriesWrapperProps> = ({
    children,
    className,
    type = 'inline-size',
    style
}) => {
    return (
        <div
            className={className}
            style={{
                containerType: type,
                ...style
            }}
        >
            {children}
        </div>
    );
};

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContainer: React.FC<CardProps> = ({ children, className }) => {
    return (
        <ContainerQueriesWrapper className={className}>
            {children}
        </ContainerQueriesWrapper>
    );
};

export const CardHeader: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`@container: (min-width: 300px) { @apply: flex flex-col gap-2; } 
                      @container: (min-width: 400px) { @apply: flex-row items-center justify-between; } 
                      ${className || ''}`}>
            {children}
        </div>
    );
};

export const CardBody: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`@container: (min-width: 300px) { @apply: p-3; } 
                      @container: (min-width: 400px) { @apply: p-4; } 
                      ${className || ''}`}>
            {children}
        </div>
    );
};

export const CardActions: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`@container: (min-width: 300px) { @apply: flex flex-col gap-2; } 
                      @container: (min-width: 400px) { @apply: flex-row gap-3; } 
                      ${className || ''}`}>
            {children}
        </div>
    );
};

interface GridContainerProps {
    children: React.ReactNode;
    className?: string;
    minColumns?: number;
    maxColumns?: number;
}

export const ResponsiveGrid: React.FC<GridContainerProps> = ({
    children,
    className,
    minColumns = 1,
    maxColumns = 4
}) => {
    return (
        <ContainerQueriesWrapper className={className}>
            <div className={`@container: (min-width: 300px) { grid-template-columns: repeat(${minColumns}, 1fr); } 
                          @container: (min-width: 600px) { grid-template-columns: repeat(${Math.min(2, maxColumns)}, 1fr); } 
                          @container: (min-width: 900px) { grid-template-columns: repeat(${Math.min(3, maxColumns)}, 1fr); } 
                          @container: (min-width: 1200px) { grid-template-columns: repeat(${Math.min(4, maxColumns)}, 1fr); }`}>
                {children}
            </div>
        </ContainerQueriesWrapper>
    );
};

interface ListContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const ResponsiveList: React.FC<ListContainerProps> = ({ children, className }) => {
    return (
        <ContainerQueriesWrapper className={className}>
            <div className={`@container: (min-width: 300px) { @apply: flex flex-col gap-2; } 
                          @container: (min-width: 600px) { @apply: grid grid-cols-2 gap-3; } 
                          ${className || ''}`}>
                {children}
            </div>
        </ContainerQueriesWrapper>
    );
};

export const ResponsiveList2Cols: React.FC<ListContainerProps> = ({ children, className }) => {
    return (
        <ContainerQueriesWrapper className={className}>
            <div className={`@container: (min-width: 400px) { @apply: grid grid-cols-2 gap-3; } 
                          @container: (min-width: 600px) { @apply: grid grid-cols-2 gap-4; } 
                          ${className || ''}`}>
                {children}
            </div>
        </ContainerQueriesWrapper>
    );
};

export const ResponsiveList3Cols: React.FC<ListContainerProps> = ({ children, className }) => {
    return (
        <ContainerQueriesWrapper className={className}>
            <div className={`@container: (min-width: 400px) { @apply: grid grid-cols-1 gap-3; } 
                          @container: (min-width: 600px) { @apply: grid grid-cols-2 gap-4; } 
                          @container: (min-width: 900px) { @apply: grid grid-cols-3 gap-4; } 
                          ${className || ''}`}>
                {children}
            </div>
        </ContainerQueriesWrapper>
    );
};

interface TextContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const ResponsiveText: React.FC<TextContainerProps> = ({ children, className }) => {
    return (
        <div className={`@container: (min-width: 300px) { @apply: text-sm; } 
                      @container: (min-width: 600px) { @apply: text-base; } 
                      @container: (min-width: 900px) { @apply: text-lg; } 
                      ${className || ''}`}>
            {children}
        </div>
    );
};

export const ResponsiveHeading: React.FC<TextContainerProps> = ({ children, className }) => {
    return (
        <div className={`@container: (min-width: 300px) { @apply: text-lg font-bold; } 
                      @container: (min-width: 600px) { @apply: text-xl font-bold; } 
                      @container: (min-width: 900px) { @apply: text-2xl font-bold; } 
                      ${className || ''}`}>
            {children}
        </div>
    );
};

export const ResponsiveParagraph: React.FC<TextContainerProps> = ({ children, className }) => {
    return (
        <p className={`@container: (min-width: 300px) { @apply: text-sm leading-relaxed; } 
                    @container: (min-width: 600px) { @apply: text-base leading-relaxed; } 
                    ${className || ''}`}>
            {children}
        </p>
    );
};

interface FlexContainerProps {
    children: React.ReactNode;
    className?: string;
    direction?: 'row' | 'column';
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
}

export const ResponsiveFlex: React.FC<FlexContainerProps> = ({
    children,
    className,
    direction = 'row',
    wrap = 'wrap'
}) => {
    return (
        <ContainerQueriesWrapper className={className}>
            <div className={`@container: (min-width: 300px) { @apply: flex ${direction} ${wrap}; } 
                          ${className || ''}`}>
                {children}
            </div>
        </ContainerQueriesWrapper>
    );
};

export const ResponsiveFlexRow: React.FC<FlexContainerProps> = ({ children, className }) => {
    return (
        <ContainerQueriesWrapper className={className}>
            <div className={`@container: (min-width: 300px) { @apply: flex flex-col gap-3; } 
                          @container: (min-width: 600px) { @apply: flex-row items-center gap-4; } 
                          ${className || ''}`}>
                {children}
            </div>
        </ContainerQueriesWrapper>
    );
};

export const ResponsiveFlexColumn: React.FC<FlexContainerProps> = ({ children, className }) => {
    return (
        <ContainerQueriesWrapper className={className}>
            <div className={`@container: (min-width: 300px) { @apply: flex flex-col gap-2; } 
                          @container: (min-width: 600px) { @apply: flex flex-row items-center gap-4; } 
                          ${className || ''}`}>
                {children}
            </div>
        </ContainerQueriesWrapper>
    );
};

export const ContainerQueriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="contents">
            {children}
        </div>
    );
};

interface SchedulerContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const SchedulerContainer: React.FC<SchedulerContainerProps> = ({ children, className }) => {
    return (
        <ContainerQueriesWrapper className={`@container ${className || ''}`}>
            <div className="@container: (min-width: 640px) { flex-row; } @container: (max-width: 639px) { flex-col; } flex w-full gap-4">
                {children}
            </div>
        </ContainerQueriesWrapper>
    );
};

interface RiderRowProps {
    children: React.ReactNode;
    className?: string;
}

export const RiderRow: React.FC<RiderRowProps> = ({ children, className }) => {
    return (
        <div className={`
            @container: (min-width: 768px) { flex-row items-center gap-4; } 
            @container: (max-width: 767px) { flex-col gap-3; }
            flex w-full border-b border-slate-200/80 transition-all duration-200
            ${className || ''}
        `}>
            {children}
        </div>
    );
};

interface ShiftCellProps {
    children: React.ReactNode;
    className?: string;
}

export const ShiftCell: React.FC<ShiftCellProps> = ({ children, className }) => {
    return (
        <div className={`
            @container: (min-width: 400px) { p-2; } 
            @container: (max-width: 399px) { p-1.5; }
            relative overflow-hidden transition-all duration-200
            ${className || ''}
        `}>
            {children}
        </div>
    );
};

interface ResponsiveSpacingProps {
    children: React.ReactNode;
    className?: string;
    direction?: 'row' | 'column';
}

export const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({
    children,
    className,
    direction = 'row'
}) => {
    const flexDirection = direction === 'row' ? 'flex-row' : 'flex-col';
    const gap = direction === 'row' ? 'gap-2 md:gap-4 lg:gap-6' : 'gap-2 md:gap-3 lg:gap-4';
    
    return (
        <div className={`
            ${flexDirection} ${gap}
            ${className || ''}
        `}>
            {children}
        </div>
    );
};

interface ResponsivePaddingProps {
    children: React.ReactNode;
    className?: string;
    vertical?: 'tight' | 'normal' | 'loose';
    horizontal?: 'tight' | 'normal' | 'loose';
}

export const ResponsivePadding: React.FC<ResponsivePaddingProps> = ({
    children,
    className,
    vertical = 'normal',
    horizontal = 'normal'
}) => {
    const verticalPadding = {
        tight: 'py-2 md:py-3',
        normal: 'py-3 md:py-4',
        loose: 'py-4 md:py-6'
    }[vertical];

    const horizontalPadding = {
        tight: 'px-2 md:px-3',
        normal: 'px-3 md:px-4',
        loose: 'px-4 md:px-6'
    }[horizontal];

    return (
        <div className={`${verticalPadding} ${horizontalPadding} ${className || ''}`}>
            {children}
        </div>
    );
};

interface ResponsiveContainerProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
    children,
    className,
    maxWidth = 'full'
}) => {
    const maxClass = `max-w-${maxWidth}`;
    
    return (
        <div className={`${maxClass} mx-auto px-4 md:px-6 lg:px-8 ${className || ''}`}>
            {children}
        </div>
    );
};

interface ResponsiveButtonGroupProps {
    children: React.ReactNode;
    className?: string;
}

export const ResponsiveButtonGroup: React.FC<ResponsiveButtonGroupProps> = ({ children, className }) => {
    return (
        <div className={`
            @container: (min-width: 640px) { flex-row gap-3; }
            @container: (max-width: 639px) { flex-col gap-2; }
            flex w-full
            ${className || ''}
        `}>
            {children}
        </div>
    );
};

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    sizes?: string;
    srcSet?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
    src,
    alt,
    className,
    sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    srcSet,
    ...props
}) => {
    return (
        <img
            src={src}
            alt={alt}
            sizes={sizes}
            srcSet={srcSet}
            className={`w-full h-auto object-cover ${className || ''}`}
            {...props}
        />
    );
};
