import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';

export interface AdvisorMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string; // ISO
}

const getDocPath = (userId: string, type: 'franchise' | 'rider') =>
  type === 'rider'
    ? doc(db, 'users', userId, 'riderAdvisorHistory')
    : doc(db, 'users', userId, 'advisorHistory');

export const advisorHistoryService = {
  async load(userId: string, type: 'franchise' | 'rider'): Promise<AdvisorMessage[]> {
    try {
      const ref = getDocPath(userId, type);
      const snap = await getDoc(ref);
      if (!snap.exists()) return [];
      return (snap.data().messages as AdvisorMessage[]) ?? [];
    } catch {
      return [];
    }
  },

  async append(
    userId: string,
    type: 'franchise' | 'rider',
    messages: AdvisorMessage[]
  ): Promise<void> {
    try {
      const ref = getDocPath(userId, type);
      await setDoc(ref, { messages: arrayUnion(...messages) }, { merge: true });
    } catch {
      // silent fail — history is non-critical
    }
  },
};
