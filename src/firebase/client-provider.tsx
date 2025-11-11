'use client';

import { useEffect, useState } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const app = initializeFirebase();
      setFirebase(app);
    } catch (e: any) {
       console.error("Firebase initialization error:", e);
       setError("Firebase bilan bog'lanishda xatolik yuz berdi. Iltimos, sozlamalarni tekshiring va sahifani yangilang.");
    }
  }, []);

  if (error) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Bog'lanishda xatolik</AlertTitle>
            <AlertDescription>
                {error} <br />
                Firebase konfiguratsiyasi (`src/firebase/config.ts`) to'g'riligiga ishonch hosil qiling.
            </AlertDescription>
          </Alert>
       </div>
    );
  }

  if (!firebase) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Firebase yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <FirebaseProvider
      app={firebase.app}
      auth={firebase.auth}
      firestore={firebase.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
