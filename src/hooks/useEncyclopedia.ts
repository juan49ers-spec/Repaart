import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    Timestamp,
    FieldValue
} from 'firebase/firestore';

export interface EncyclopediaCategory {
    id: string;
    title: string;
    icon: string;
    description: string;
    order: number;
}

export interface EncyclopediaArticle {
    id: string;
    categoryId: string;
    title: string;
    content: string;
    action?: string; // Legacy support or new field if needed
    example?: string; // Legacy support
    order?: number;
    updatedAt?: Timestamp | FieldValue;
    isFeatured?: boolean;
}

// Unified interface for UI consumption
export interface EncyclopediaCard extends EncyclopediaArticle {
    categoryTitle?: string; // Hydrated for UI
    category?: string; // Legacy field for UI compatibility
}

export const useEncyclopedia = () => {
    const [categories, setCategories] = useState<EncyclopediaCategory[]>([]);
    const [articles, setArticles] = useState<EncyclopediaArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error] = useState<Error | null>(null);

    useEffect(() => {
        // 1. Listen to Categories
        const catQuery = query(collection(db, 'academy_encyclopedia_categories'), orderBy('order', 'asc'));
        const unsubCat = onSnapshot(catQuery, (snap) => {
            const cats = snap.docs.map(d => ({ id: d.id, ...d.data() } as EncyclopediaCategory));
            setCategories(cats);
        }, (err) => console.error("Error fetching categories:", err));

        // 2. Listen to Articles
        const artQuery = query(collection(db, 'academy_encyclopedia_articles'), orderBy('order', 'asc'));
        const unsubArt = onSnapshot(artQuery, (snap) => {
            const arts = snap.docs.map(d => ({ id: d.id, ...d.data() } as EncyclopediaArticle));
            setArticles(arts);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching articles:", err);
            setLoading(false);
        });

        return () => {
            unsubCat();
            unsubArt();
        };
    }, []);

    // Helper: Join Articles with Category Titles
    const cards: EncyclopediaCard[] = articles.map(article => {
        const cat = categories.find(c => c.id === article.categoryId);
        return {
            ...article,
            categoryTitle: cat?.title || 'General',
            category: cat?.title || 'General' // For backward compatibility
        } as EncyclopediaCard;
    });

    const updateModule = async (id: string, updates: Partial<EncyclopediaArticle>) => {
        try {
            const ref = doc(db, 'academy_encyclopedia_articles', id);
            await updateDoc(ref, updates);
        } catch (err) {
            console.error("Error updating module:", err);
            throw err;
        }
    };

    return {
        categories,
        articles,
        cards, // For backward compatibility with View
        loading,
        error,
        updateModule
    };
};
