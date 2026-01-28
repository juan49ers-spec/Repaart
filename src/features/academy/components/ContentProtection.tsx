import { useEffect } from 'react';

interface ContentProtectionProps {
    children: React.ReactNode;
}

const ContentProtection = ({ children }: ContentProtectionProps) => {
    useEffect(() => {
        // Prevent keyboard shortcuts for copy
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent Ctrl+C, Cmd+C, Ctrl+X, Cmd+X, Ctrl+A, Cmd+A
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.key === 'a')) {
                e.preventDefault();
            }
            // Prevent F12, Ctrl+U, Ctrl+Shift+I, Cmd+Option+I
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
            }
        };

        // Prevent right-click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // Prevent selection
        const handleSelectStart = (e: Event) => {
            e.preventDefault();
        };

        // Prevent copy event
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
        };

        // Prevent cut event
        const handleCut = (e: ClipboardEvent) => {
            e.preventDefault();
        };

        // Add event listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCut);

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCut);
        };
    }, []);

    return (
        <div
            className="protected-content"
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
            }}
        >
            {children}
        </div>
    );
};

export default ContentProtection;