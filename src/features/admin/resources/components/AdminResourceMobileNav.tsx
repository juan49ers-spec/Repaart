import React from 'react';

interface FolderDef {
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
}

interface AdminResourceMobileNavProps {
    folders: FolderDef[];
    activeCategory: string;
    setActiveCategory: (cat: string) => void;
}

export const AdminResourceMobileNav: React.FC<AdminResourceMobileNavProps> = ({ folders, activeCategory, setActiveCategory }) => {
    return (
        <div className="md:hidden shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap p-4 no-scrollbar flex gap-2">
            {folders.map(folder => {
                const isActive = activeCategory === folder.id;
                return (
                    <button
                        key={folder.id}
                        onClick={() => setActiveCategory(folder.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isActive
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                    >
                        <folder.icon size={14} />
                        {folder.label}
                    </button>
                );
            })}
        </div>
    );
};
