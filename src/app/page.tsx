'use client';

import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Header } from '@/components/header';
import { SpeechCraftClient } from '@/components/speech-craft-client';
import { Loader2, RefreshCw } from 'lucide-react';
import { doc, setDoc, onSnapshot, collection, getDocs, query } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { sentences, emotions } from '@/lib/sentences';
import { emotionInstructions } from '@/lib/instructions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildPendingTasks, buildSentenceOptions } from '@/lib/recording-task-utils';
import { copy } from '@/lib/i18n';
import { useAppLang } from '@/hooks/use-app-lang';

type RecordingTask = {
  textId: string;
  text: string;
  emotion: string;
};

function PromptDisplay({
  task,
  onNextClick,
  allCompleted,
  sentenceOptions,
  onSentenceChange,
  lang,
}: {
  task: RecordingTask | null;
  onNextClick: () => void;
  allCompleted: boolean;
  sentenceOptions: Array<{ textId: string; label: string; remaining: number }>;
  onSentenceChange: (textId: string) => void;
  lang: 'uz' | 'ru' | 'en';
}) {
  const instruction = task ? emotionInstructions[task.emotion] : null;

  return (
    <div className="bg-card border-b py-4">
      <div className="container mx-auto flex flex-col gap-3">
        {allCompleted ? (
          <p className="text-center text-lg text-green-600 font-semibold">Barcha gaplar 8 xil emotsiyada yozib olindi. Rahmat!</p>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1">
                <p className="text-lg text-foreground">
                  <span className="font-semibold mr-2">{copy[lang].text}:</span>
                  <span className="text-muted-foreground">{task?.text}</span>
                </p>
                <p className="text-sm mt-1">
                  <span className="font-semibold mr-2">{copy[lang].emotion}:</span>
                  <span className="text-primary font-medium uppercase">{task?.emotion}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select onValueChange={onSentenceChange}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder={copy[lang].chooseSentence} />
                  </SelectTrigger>
                  <SelectContent>
                    {sentenceOptions.map((option) => (
                      <SelectItem key={option.textId} value={option.textId}>
                        {option.label} ({option.remaining} qoldi)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={onNextClick}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {instruction && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-semibold">{instruction.title}</p>
                <p className="mt-1">{instruction.description}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Footer({ completedTasks, totalTasks, lang }: { completedTasks: number; totalTasks: number; lang: 'uz' | 'ru' | 'en' }) {
  return (
    <footer className="bg-card border-t py-3">
      <div className="container mx-auto flex justify-between items-center text-sm text-muted-foreground">
        <p>{copy[lang].progress}: {completedTasks}/{totalTasks}</p>
        <p>{copy[lang].emotionsPerSentence}: {emotions.length}</p>
      </div>
    </footer>
  );
}

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { lang } = useAppLang();
  const [availableTasks, setAvailableTasks] = useState<RecordingTask[]>([]);
  const [currentTask, setCurrentTask] = useState<RecordingTask | null>(null);
  const [allCompleted, setAllCompleted] = useState(false);

  const totalTaskCount = sentences.length * emotions.length;
  const completedTaskCount = totalTaskCount - availableTasks.length;

  const sentenceOptions = useMemo(() => buildSentenceOptions(sentences, availableTasks), [availableTasks]);

  useEffect(() => {
    if (user && firestore) {
      const recordingsRef = collection(firestore, 'users', user.uid, 'recordings');
      const q = query(recordingsRef);
      getDocs(q).then((snapshot) => {
        const existing = snapshot.docs.map((record) => {
          const data = record.data();
          return { textId: data.textId as string | undefined, emotion: data.emotion as string | undefined };
        });

        const pendingTasks = buildPendingTasks(sentences, emotions, existing) as RecordingTask[];

        setAvailableTasks(pendingTasks);
        if (pendingTasks.length > 0) {
          setCurrentTask(pendingTasks[Math.floor(Math.random() * pendingTasks.length)]);
          setAllCompleted(false);
        } else {
          setAllCompleted(true);
          setCurrentTask(null);
        }
      });
    }
  }, [user, firestore]);

  const getNextTask = useCallback(() => {
    setCurrentTask((prev) => {
      if (availableTasks.length === 0) {
        setAllCompleted(true);
        return null;
      }

      const choices = prev
        ? availableTasks.filter((task) => !(task.textId === prev.textId && task.emotion === prev.emotion))
        : availableTasks;

      const source = choices.length > 0 ? choices : availableTasks;
      return source[Math.floor(Math.random() * source.length)];
    });
  }, [availableTasks]);

  const handleSentenceChange = useCallback(
    (textId: string) => {
      const tasksForSentence = availableTasks.filter((task) => task.textId === textId);
      if (tasksForSentence.length === 0) return;
      setCurrentTask(tasksForSentence[0]);
    },
    [availableTasks]
  );

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

  const handleRecordingSaved = ({ textId, emotion }: { textId: string; emotion: string }) => {
    const updatedAvailable = availableTasks.filter((task) => !(task.textId === textId && task.emotion === emotion));
    setAvailableTasks(updatedAvailable);

    if (updatedAvailable.length > 0) {
      setCurrentTask(updatedAvailable[Math.floor(Math.random() * updatedAvailable.length)]);
    } else {
      setAllCompleted(true);
      setCurrentTask(null);
    }
  };

  if (loading || !user || !userProfile || (!currentTask && !allCompleted)) {
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
        task={currentTask}
        onNextClick={getNextTask}
        allCompleted={allCompleted}
        sentenceOptions={sentenceOptions}
        onSentenceChange={handleSentenceChange}
        lang={lang}
      />
      <main className="flex-1 overflow-auto bg-background/90">
        {!allCompleted && currentTask && (
          <SpeechCraftClient
            key={`${currentTask.textId}-${currentTask.emotion}`}
            textId={currentTask.textId}
            forcedEmotion={currentTask.emotion}
            onRecordingSaved={handleRecordingSaved}
          />
        )}
      </main>
      <Footer completedTasks={completedTaskCount} totalTasks={totalTaskCount} lang={lang} />
    </div>
  );
}
