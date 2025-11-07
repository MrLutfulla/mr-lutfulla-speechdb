import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// The function `getApp` returns the initialized `FirebaseApp` instance.
// But if it hasn't been initialized, it throws an exception.
// So, we need to check if there are any apps initialized.
// If not, then we initialize one.
// We are using this logic here because in the component where we are using
// this function, we cannot do so because of the React hooks limitations.
// We can't wrap the `initializeApp` in a `useEffect`
// as we need the returned value from `getFunctions`.

function initializeFirebase() {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  return { app, auth, firestore, storage };
}

export * from './provider';
export * from './auth/use-user';
export { initializeFirebase };
