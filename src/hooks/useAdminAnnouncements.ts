import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, arrayUnion, updateDoc } from 'firebase/firestore';

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'news' | 'alert' | 'poll';
    priority: 'normal' | 'high' | 'critical';
    targetAudience: 'all' | 'specific';
    targetFranchises: string[];
    createdAt: Date;
    reads: string[];
    votes: any[]; // Define a stricter type if voting structure is known
    [key: string]: any;
}

export const useAdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const q = query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as Announcement[];
            setAnnouncements(data);
            setLoading(false);
        }, () => {
            // console.warn("Error fetching announcements:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const createAnnouncement = async (
        title: string,
        content: string,
        type: 'news' | 'alert' | 'poll' = 'news',
        priority: 'normal' | 'high' | 'critical' = 'normal',
        targetAudience: 'all' | 'specific' = 'all',
        targetFranchises: string[] = []
    ) => {
        await addDoc(collection(db, 'announcements'), {
            title,
            content,
            type, // 'news', 'alert', 'poll'
            priority, // 'normal', 'high', 'critical'
            targetAudience, // 'all', 'specific'
            targetFranchises, // array of franchise IDs
            createdAt: serverTimestamp(),
            reads: [], // Array of userIDs who read it
            votes: []
        });
    };

    const markAsRead = async (announcementId: string, userId: string) => {
        if (!userId) return;
        const ref = doc(db, 'announcements', announcementId);
        // We use arrayUnion to add unique userIds only
        await updateDoc(ref, {
            reads: arrayUnion(userId)
        });
    };

    const deleteAnnouncement = async (id: string) => {
        await deleteDoc(doc(db, 'announcements', id));
    };

    return {
        announcements,
        loading,
        createAnnouncement,
        deleteAnnouncement,
        markAsRead
    };
};
