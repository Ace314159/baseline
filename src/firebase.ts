import { getAuth, signOut } from '@firebase/auth';
import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence } from '@firebase/auth';
import { Capacitor } from '@capacitor/core';
import { enableLogging } from '@firebase/database';
import ldb from './db';
import { Auth } from '@firebase/auth';

enableLogging(true);
export const firebase = initializeApp(JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG as string));
export let auth: Auth;
if (Capacitor.isNativePlatform()) {
    auth = initializeAuth(firebase, {
        persistence: indexedDBLocalPersistence
    });
} else {
    auth = getAuth();
}

export const signOutAndCleanUp = () => {
    ldb.logs.clear();
    signOut(auth);
}