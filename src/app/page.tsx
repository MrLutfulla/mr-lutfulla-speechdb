'use client';

import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/header';
import { SpeechCraftClient } from '@/components/speech-craft-client';
import { Loader2 } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';


export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && firestore) {
      // Save or update user profile in Firestore
      const userRef = doc(firestore, 'users', user.uid);
      const userData: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      setDoc(userRef, userData, { merge: true });
    }
  }, [user, loading, router, firestore]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-auto">
        <SpeechCraftClient />
      </main>
    </div>
  );
}
