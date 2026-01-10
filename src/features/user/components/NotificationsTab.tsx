import { useState, useEffect, type FC } from 'react';
import { Mail } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { type User } from 'firebase/auth';

interface NotificationsTabProps {
    user: User;
    showMessage: (type: string, text: string) => void;
}

interface UserPrefs {
    emailNotifications: boolean;
    [key: string]: boolean;
}

const NotificationsTab: FC<NotificationsTabProps> = ({ user, showMessage }) => {
    const [prefs, setPrefs] = useState<UserPrefs>({
        emailNotifications: true
    });

    useEffect(() => {
        const loadPrefs = async () => {
            try {
                // Use 'users' collection instead of 'users_config' to simplify and use existing safe rules
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setPrefs({
                        // Load prefs from the main user document
                        emailNotifications: data.emailNotifications ?? true
                    });
                }
            } catch (error) {
                console.error("Error loading prefs:", error);
            }
        };
        loadPrefs();
    }, [user]);

    const togglePref = async (key: string) => {
        const newVal = !prefs[key];
        setPrefs(prev => ({ ...prev, [key]: newVal }));

        try {
            // Write to 'users' collection
            await setDoc(doc(db, "users", user.uid), {
                [key]: newVal
            }, { merge: true });
        } catch (error) {
            console.error("Error saving pref:", error);
            // Revert state on error
            setPrefs(prev => ({ ...prev, [key]: !newVal }));
            showMessage('error', 'Error al guardar preferencia');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4">Preferencias de Contacto</h2>
            <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">Notificaciones por Email</p>
                            <p className="text-xs text-slate-500">Recibir actualizaciones importantes y alertas a tu correo.</p>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${prefs.emailNotifications ? 'bg-indigo-600' : 'bg-slate-300'}`} onClick={() => togglePref('emailNotifications')}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${prefs.emailNotifications ? 'translate-x-6' : ''}`} />
                    </div>
                </label>
            </div>
        </div>
    );
};

export default NotificationsTab;
