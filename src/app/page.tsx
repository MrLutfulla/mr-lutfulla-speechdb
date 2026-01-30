'use client';

import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/header';
import { SpeechCraftClient } from '@/components/speech-craft-client';
import { Loader2 } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';

function PromptDisplay() {
  return (
    <div className="bg-card border-b py-4">
        <div className="container mx-auto">
            <p className="text-center text-lg text-foreground">
                <span className="font-semibold mr-2">Matn:</span>
                <span className="text-muted-foreground">Yangi dastur bizning imkoniyatlarimizni kengaytiradi.</span>
            </p>
        </div>
    </div>
  );
}

function Footer() {
    return (
        <footer className="bg-card border-t py-3">
            <div className="container mx-auto flex justify-between items-center text-sm text-muted-foreground">
                <p>Yozma: 3 ta / Qolgan: 7 ta</p>
                <div className="flex items-center gap-2">
                    <span>Ovoz balandligi:</span>
                    <div className="w-32 h-4 bg-muted rounded-full overflow-hidden flex">
                        <div className="w-[60%] bg-green-500 h-full"></div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      getDoc(userRef).then(docSnap => {
        if (!docSnap.exists()) {
          const userData: Partial<UserProfile> = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            recordingCount: 0,
          };
          setDoc(userRef, userData, { merge: true });
        }
      });
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
      <PromptDisplay />
      <main className="flex-1 overflow-auto bg-background/90">
        <SpeechCraftClient />
      </main>
      <Footer />
    </div>
  );
}
