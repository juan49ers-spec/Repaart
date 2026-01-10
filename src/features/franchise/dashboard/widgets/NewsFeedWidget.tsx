import { useMemo, type FC } from 'react';
import { useAdminAnnouncements } from '../../../../hooks/useAdminAnnouncements';
import { Megaphone, Bell, CheckCircle } from 'lucide-react';
import Card from '../../../../ui/layout/Card';
import { useAuth } from '../../../../context/AuthContext';

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'critical' | 'high' | 'normal';
    targetAudience: 'all' | 'specific';
    targetFranchises?: string[];
    reads?: string[];
    createdAt?: Date;
}

const NewsFeedWidget: FC = () => {
    const { announcements, loading, markAsRead } = useAdminAnnouncements();
    const { user, roleConfig } = useAuth();

    // Filter relevant news
    const relevantNews = useMemo(() => {
        if (!user) return [];
        return announcements.filter((news: Announcement) => {
            // 1. Audience Check
            if (news.targetAudience === 'specific') {
                // Check if user's franchiseId is in target list
                // user.uid is fallback if no franchiseId assigned yet (rare for franchises)
                const userFranchiseId = roleConfig?.franchiseId || user.uid;
                if (!news.targetFranchises?.includes(userFranchiseId)) {
                    return false;
                }
            }
            return true;
        });
    }, [announcements, user, roleConfig]);

    // Derived state for display
    const visibleNews = relevantNews.slice(0, 3);
    const unreadCount = relevantNews.filter((n: Announcement) => !n.reads?.includes(user?.uid || '')).length;

    const handleInteraction = (news: Announcement): void => {
        if (user && !news.reads?.includes(user.uid)) {
            markAsRead(news.id, user.uid);
        }
    };

    if (loading) return <Card className="animate-pulse h-48 bg-slate-50"><div /></Card>;

    return (
        <Card className="h-full border-blue-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Megaphone className="w-24 h-24 text-blue-500" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600 animate-bounce-subtle' : 'text-slate-400'}`} />
                    <h3 className="font-bold text-slate-700">Novedades HQ</h3>
                </div>
                {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {unreadCount} nuevos
                    </span>
                )}
            </div>

            <div className="space-y-3 relative z-10">
                {visibleNews.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-slate-400 italic">No hay novedades para ti.</p>
                    </div>
                ) : (
                    visibleNews.map((news: Announcement) => {
                        const isRead = news.reads?.includes(user?.uid || '');
                        return (
                            <div
                                key={news.id}
                                onClick={() => handleInteraction(news)}
                                className={`flex gap-3 items-start p-2.5 rounded-lg transition-all cursor-pointer group
                                    ${isRead ? 'hover:bg-slate-50 opacity-90' : 'bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 shadow-sm'}
                                `}
                            >
                                <div className={`mt-1 shrink-0 w-2 h-2 rounded-full transition-transform group-hover:scale-125 
                                    ${!isRead ? 'bg-rose-500 ring-2 ring-rose-200' :
                                        news.priority === 'critical' ? 'bg-rose-400' :
                                            news.priority === 'high' ? 'bg-amber-400' : 'bg-slate-300'}
                                `} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-sm font-bold truncate pr-2 ${news.priority === 'critical' ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {news.title}
                                        </h4>
                                        {isRead && <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </div>

                                    <p className={`text-xs line-clamp-2 mt-0.5 ${isRead ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                                        {news.content}
                                    </p>
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                        {news.createdAt?.toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <button className="w-full mt-auto pt-4 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-2 rounded transition-colors text-center relative z-10">
                Ver Historial Completo
            </button>
        </Card>
    );
};

export default NewsFeedWidget;
