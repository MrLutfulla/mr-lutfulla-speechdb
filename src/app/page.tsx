'use client';

import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/header';
import { SpeechCraftClient } from '@/components/speech-craft-client';
import { Loader2, RefreshCw } from 'lucide-react';
import { doc, setDoc, onSnapshot, collection, getDocs, query } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { sentences } from '@/lib/sentences';
import { Button } from '@/components/ui/button';

function PromptDisplay({ text, onNextClick, allCompleted }: { text: string; onNextClick: () => void; allCompleted: boolean; }) {
  return (
    <div className="bg-card border-b py-4">
      <div className="container mx-auto flex items-center justify-center min-h-[60px]">
        {allCompleted ? (
          <p className="text-center text-lg text-green-600 font-semibold">Barcha matnlar yozib olindi. E'tiboringiz uchun rahmat!</p>
        ) : (
          <>
            <p className="text-center text-lg text-foreground">
                <span className="font-semibold mr-2">Matn:</span>
                <span className="text-muted-foreground">{text}</span>
            </p>
            <Button variant="ghost" size="icon" onClick={onNextClick} className="ml-4">
                <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Footer({ recordingCount, totalDuration }: { recordingCount: number, totalDuration: number }) {
    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <footer className="bg-card border-t py-3">
            <div className="container mx-auto flex justify-between items-center text-sm text-muted-foreground">
                <p>Yozmalar: {recordingCount} ta</p>
                <p>Umumiy vaqt: {formatDuration(totalDuration)}</p>
            </div>
        </footer>
    )
}

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [availableSentences, setAvailableSentences] = useState(sentences);
  const [currentSentence, setCurrentSentence] = useState<{ id: string; text: string; } | null>(null);
  const [allCompleted, setAllCompleted] = useState(false);

  // O'qilgan matnlarni olib, faqat o'qilmaganlarini ajratib oladi
  useEffect(() => {
    if (user && firestore) {
        const recordingsRef = collection(firestore, 'users', user.uid, 'recordings');
        const q = query(recordingsRef);
        getDocs(q).then(snapshot => {
            const recordedTextIds = new Set(snapshot.docs.map(doc => doc.data().textId));
            const unrecorded = sentences.filter(sentence => !recordedTextIds.has(sentence.id));
            setAvailableSentences(unrecorded);
            
            if (unrecorded.length > 0) {
                setCurrentSentence(unrecorded[Math.floor(Math.random() * unrecorded.length)]);
            } else {
                setAllCompleted(true);
            }
        });
    }
  }, [user, firestore]);

  // Matnni yangilash funksiyasi
  const getNextSentence = useCallback(() => {
    if (availableSentences.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableSentences.length);
        setCurrentSentence(availableSentences[randomIndex]);
    } else {
        setAllCompleted(true);
    }
  }, [availableSentences]);


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          const userData: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            recordingCount: 0,
            totalDuration: 0,
          };
          setDoc(userRef, userData, { merge: true });
          setUserProfile(userData);
        }
      });
      return () => unsubscribe();
    }
  }, [user, loading, router, firestore]);

  // Ovoz saqlangandan so'ng chaqiriladi
  const handleRecordingSaved = (savedTextId: string) => {
    const updatedAvailable = availableSentences.filter(s => s.id !== savedTextId);
    setAvailableSentences(updatedAvailable);
    if (updatedAvailable.length > 0) {
        setCurrentSentence(updatedAvailable[Math.floor(Math.random() * updatedAvailable.length)]);
    } else {
        setAllCompleted(true);
    }
  };

  if (loading || !user || !userProfile || (!currentSentence && !allCompleted)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <PromptDisplay 
        text={currentSentence?.text || ''} 
        onNextClick={getNextSentence} 
        allCompleted={allCompleted}
      />
      <main className="flex-1 overflow-auto bg-background/90">
        {!allCompleted && currentSentence && (
            <SpeechCraftClient 
                key={currentSentence.id} // Re-mount component on sentence change
                textId={currentSentence.id} 
                onRecordingSaved={handleRecordingSaved} 
            />
        )}
      </main>
      <Footer 
        recordingCount={userProfile.recordingCount || 0} 
        totalDuration={userProfile.totalDuration || 0} 
      />
    </div>
  );
}
