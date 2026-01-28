import React, { memo } from 'react';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Timestamp } from 'firebase/firestore';

export interface Message {
    id: string;
    text: string;
    senderRole: 'admin' | 'user' | 'system';
    senderName?: string;
    isInternal?: boolean;
    createdAt?: string | number | Timestamp;
    timestamp?: string | number | Timestamp;
    attachmentUrl?: string;
    attachmentName?: string;
}

interface SharedMessageProps {
    msg: Message;
}

export const getStatusBadgeStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
        open: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20' },
        resolved: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
        closed: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
        investigating: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20' },
        pending_user: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/20' },
    };

    return styles[status] || styles.closed;
};

export const formatRelativeTime = (date: string | number | Timestamp | undefined): string => {
    if (!date) return 'Ahora';

    let timestamp: number;
    if (typeof date === 'number') {
        timestamp = date;
    } else if (typeof date === 'string') {
        timestamp = new Date(date).getTime();
    } else if (date && 'seconds' in date) {
        timestamp = date.seconds * 1000;
    } else {
        return 'Reciente';
    }

    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return new Date(timestamp).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
};

const SharedMessage: React.FC<SharedMessageProps> = memo(({ msg }) => {
    const senderIsAdmin = msg.senderRole === 'admin';
    const senderIsSystem = msg.senderRole === 'system';
    const isInternal = msg.isInternal;

    if (isInternal) {
        return null; // Ensure internal notes are never rendered for franchises
    }

    if (senderIsSystem) {
        return (
            <div className="flex justify-center my-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm backdrop-blur-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="font-semibold">Sistema:</span>
                    <span className="opacity-90">{msg.text}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
            senderIsAdmin ? 'justify-end' : 'justify-start'
        )}>
            <div className={cn(
                "max-w-[90%] md:max-w-[80%] lg:max-w-[75%] transition-all shadow-sm",
                senderIsAdmin
                    ? 'flex flex-col items-end'
                    : 'flex flex-col items-start'
            )}>
                <div className={cn(
                    "flex items-center gap-2 mb-2 px-1",
                    senderIsAdmin ? 'justify-end' : 'justify-start'
                )}>
                    <span className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        senderIsAdmin
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg'
                            : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg'
                    )}>
                        {senderIsAdmin ? 'Soporte' : (msg.senderName || 'Tú')}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        {formatRelativeTime(msg.createdAt || msg.timestamp)}
                    </span>
                </div>

                <div className={cn(
                    "p-5 rounded-2xl text-sm leading-relaxed backdrop-blur-sm transition-all",
                    senderIsAdmin
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-600 dark:to-blue-700 text-white shadow-md shadow-indigo-500/20 rounded-br-md'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm rounded-bl-md'
                )}>
                    <div
                        className={cn(
                            "prose prose-sm",
                            senderIsAdmin ? 'prose-invert' : 'prose-slate dark:prose-invert'
                        )}
                        dangerouslySetInnerHTML={{ __html: msg.text }}
                    />

                    {msg.attachmentUrl && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-95"
                            >
                                <FileText className="w-4 h-4" />
                                {msg.attachmentName || 'Ver Archivo Adjunto'}
                                <Download className="w-3.5 h-3.5 ml-1" />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

SharedMessage.displayName = 'SharedMessage';

export default SharedMessage;
