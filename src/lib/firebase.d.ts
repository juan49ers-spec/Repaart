import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

export const auth: Auth;
export const db: Firestore;
export const storage: FirebaseStorage;
export const firebaseConfigExport: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
};
