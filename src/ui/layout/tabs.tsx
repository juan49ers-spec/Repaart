import { createContext, useContext, type FC, type ReactNode } from 'react';

interface TabsContextType {
    value?: string;
    onValueChange?: (value: string) => void;
}

const TabsContext = createContext<TabsContextType>({});

interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
    className?: string;
}

export const Tabs: FC<TabsProps> = ({ value, onValueChange, children, className = "" }) => {
    return (
        <TabsContext.Provider value={{ value, onValueChange }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
};

interface TabsListProps {
    children: ReactNode;
    className?: string;
}

export const TabsList: FC<TabsListProps> = ({ children, className = "" }) => {
    return <div className={`flex ${className}`}>{children}</div>;
};

interface TabsTriggerProps {
    value: string;
    children: ReactNode;
    className?: string;
}

export const TabsTrigger: FC<TabsTriggerProps> = ({ value, children, className = "" }) => {
    const { value: selectedValue, onValueChange } = useContext(TabsContext);
    const isActive = selectedValue === value;

    return (
        <button
            onClick={() => onValueChange?.(value)}
            className={`${className} ${isActive ? 'data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            data-state={isActive ? 'active' : 'inactive'}
        >
            {children}
        </button>
    );
};

interface TabsContentProps {
    value: string;
    children: ReactNode;
    className?: string;
}

export const TabsContent: FC<TabsContentProps> = ({ value, children, className = "" }) => {
    const { value: selectedValue } = useContext(TabsContext);
    if (selectedValue !== value) return null;
    return <div className={className}>{children}</div>;
};
