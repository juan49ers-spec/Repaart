import { useState, useEffect, type FC } from 'react';
import { Mail, Clock, CheckCircle2, Ticket, DollarSign, AlertTriangle, Lock, ShieldAlert, BookOpen, Bell } from 'lucide-react';
import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { type User } from 'firebase/auth';
import { formatTimeAgo } from '../../../utils/dateHelpers';

interface NotificationsTabProps {
    user: User;
    showMessage: (type: string, text: string) => void;
}

interface UserPrefs {
    emailNotifications: boolean;
    [key: string]: boolean;
}

interface NotificationHistoryItem {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: Timestamp;
    read: boolean;
    priority?: string;
}

const NotificationsTab: FC<NotificationsTabProps> = ({ user, showMessage }) => {
    const [prefs, setPrefs] = useState<UserPrefs>({
        emailNotifications: true
    });
    const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        const loadPrefs = async () => {
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setPrefs({
                        emailNotifications: data.emailNotifications ?? true
                    });
                }
            } catch (error) {
                console.error("Error loading prefs:", error);
            }
        };

        const loadHistory = async () => {
            try {
                // Determine collection based on role (simple heuristic: if "admin_notifications" exists?)
                // Actually, for now, we assume this is the user's view, so we query 'notifications' or 'admin_notifications'
                // But this component is typically used in Profile, which is for Franchises.
                // Admins have a different notifications view usually.
                // Let's assume Franchise context first: 'notifications' collection.

                const targetIds = [user.uid];
                // checking if user has franchiseId in a safe way without type assertion failure if needed
                if ((user as any).franchiseId) targetIds.push((user as any).franchiseId);

                const q = query(
                    collection(db, "notifications"),
                    where("userId", "in", targetIds),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );

                const snapshot = await getDocs(q);
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationHistoryItem));
                setHistory(list);
            } catch (error) {
                console.error("Error loading history:", error);
            } finally {
                setLoadingHistory(false);
            }
        };

        loadPrefs();
        loadHistory();
    }, [user]);

    const togglePref = async (key: string) => {
        const newVal = !prefs[key];
        setPrefs(prev => ({ ...prev, [key]: newVal }));

        try {
            await setDoc(doc(db, "users", user.uid), {
                [key]: newVal
            }, { merge: true });
        } catch (error) {
            console.error("Error saving pref:", error);
            setPrefs(prev => ({ ...prev, [key]: !newVal }));
            showMessage('error', 'Error al guardar preferencia');
        }
    };

    const getIcon = (type?: string) => {
        const baseClass = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border";
        switch (type) {
            case 'FINANCE_CLOSING': return <div className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><DollarSign className="w-4 h-4" /></div>;
            case 'RATE_CHANGE': return <div className={`${baseClass} bg-amber-50 text-amber-500 border-amber-100`}><AlertTriangle className="w-4 h-4" /></div>;
            case 'SUPPORT_TICKET': return <div className={`${baseClass} bg-blue-50 text-blue-500 border-blue-100`}><Ticket className="w-4 h-4" /></div>;
            case 'UNLOCK_REQUEST': return <div className={`${baseClass} bg-amber-50 text-amber-600 border-amber-100`}><Lock className="w-4 h-4" /></div>;
            case 'MONTH_UNLOCKED': return <div className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><CheckCircle2 className="w-4 h-4" /></div>;
            case 'UNLOCK_REJECTED': return <div className={`${baseClass} bg-rose-50 text-rose-600 border-rose-100`}><ShieldAlert className="w-4 h-4" /></div>;
            case 'GUIDE_TIP': return <div className={`${baseClass} bg-indigo-50 text-indigo-600 border-indigo-100`}><BookOpen className="w-4 h-4" /></div>;
            case 'shift_change_request': return <div className={`${baseClass} bg-amber-50 text-amber-600 border-amber-100`}><AlertTriangle className="w-4 h-4" /></div>;
            case 'shift_confirmed': return <div className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><CheckCircle2 className="w-4 h-4" /></div>;
            case 'incident': return <div className={`${baseClass} bg-rose-50 text-rose-600 border-rose-100`}><ShieldAlert className="w-4 h-4" /></div>;
            default: return <div className={`${baseClass} bg-slate-50 text-slate-400 border-slate-100`}><Bell className="w-4 h-4" /></div>;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Preferences Section */}
            <section>
                <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Preferencias de Contacto</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors shadow-sm group">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">Notificaciones por Email</p>
                                <p className="text-xs text-slate-500 mt-0.5">Recibir actualizaciones importantes a tu correo.</p>
                            </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors ${prefs.emailNotifications ? 'bg-indigo-600' : 'bg-slate-200'}`} onClick={() => togglePref('emailNotifications')}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${prefs.emailNotifications ? 'translate-x-5' : ''}`} />
                        </div>
                    </label>
                </div>
            </section>

            {/* History Section */}
            <section>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-xl font-black text-slate-800">Historial de Notificaciones</h2>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Últimas 50</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {loadingHistory ? (
                        <div className="p-12 text-center text-slate-400">
                            Cargando historial...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="font-bold text-slate-900">Historial vacío</p>
                            <p className="text-sm text-slate-500 mt-1">No hay notificaciones registradas recientemente.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {history.map((item) => (
                                <div key={item.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                                    <div className="mt-1">
                                        {getIcon(item.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                                {item.createdAt ? formatTimeAgo(item.createdAt.toDate()) : '-'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{item.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default NotificationsTab;
