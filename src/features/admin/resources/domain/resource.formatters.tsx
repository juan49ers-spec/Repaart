import React from 'react';
import { FileText, Image as ImageIcon, Folder, File } from 'lucide-react';

export const formatBytes = (bytes?: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFileIcon = (type?: string): React.ReactNode => {
    if (type?.includes('pdf')) return <FileText className="w-10 h-10 text-rose-500" />;
    if (type?.includes('image')) return <ImageIcon className="w-10 h-10 text-indigo-500" />;
    if (type?.includes('zip')) return <Folder className="w-10 h-10 text-amber-500" />;
    if (type?.includes('sheet') || type?.includes('excel')) return <FileText className="w-10 h-10 text-emerald-500" />;
    if (type?.includes('presentation')) return <FileText className="w-10 h-10 text-orange-500" />;
    return <File className="w-10 h-10 text-slate-400" />;
};
