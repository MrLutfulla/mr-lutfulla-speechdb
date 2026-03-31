'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, runTransaction, collection, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder } from '@/components/audio-recorder'; 
import { MetadataForm } from '@/components/metadata-form';
import { NewRecordingMetadata, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { importantNote } from '@/lib/instructions';

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface SpeechCraftClientProps {
  textId: string;
  forcedEmotion: string;
  onRecordingSaved: (saved: { textId: string; emotion: string }) => void;
}

export function SpeechCraftClient({ textId, forcedEmotion, onRecordingSaved }: SpeechCraftClientProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [metadata, setMetadata] = useState<Omit<NewRecordingMetadata, 'textId'> | null>(null);
  const [isMetadataValid, setIsMetadataValid] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMetadataChange = useCallback((newMetadata: Omit<NewRecordingMetadata, 'textId'>, isValid: boolean) => {
    setMetadata(newMetadata);
    setIsMetadataValid(isValid);
  }, []);

  const handleSave = async () => {
    if (!user || !firestore || !metadata || !isMetadataValid || !audioBlob) {
      let error = "Noma'lum xatolik.";
      if(!user || !firestore) error = "Foydalanuvchi tizimga kirmagan.";
      if(!audioBlob) error = "Iltimos, avval ovozingizni yozing.";
      if(!metadata || !isMetadataValid) error = "Iltimos, barcha kerakli ma'lumotlarni kiriting.";
      
      toast({ title: "Xatolik", description: error, variant: "destructive" });
      return;
    }

    setIsSaving(true);
    toast({ title: "Saqlanmoqda...", description: "Yozuvingiz serverga yuklanmoqda." });

    try {
      const audioBase64 = await blobToBase64(audioBlob);
      if (audioBase64.length > 1572864) {
        toast({ title: "Xatolik", description: "Ovoz yozuvi juda katta (1.5MB dan oshmasligi kerak).", variant: "destructive" });
        setIsSaving(false);
        return;
      }

      const userRef = doc(firestore, 'users', user.uid);
      const fullMetadata: NewRecordingMetadata = { ...metadata, textId, emotion: forcedEmotion };

      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("Foydalanuvchi profili topilmadi!");

        const userProfile = userDoc.data() as UserProfile;
        const currentCount = userProfile.recordingCount || 0;
        const currentDuration = userProfile.totalDuration || 0;
        
        const recordingsCollection = collection(userRef, 'recordings');
        const newRecordingRef = doc(recordingsCollection);

        const speakerName = userProfile.displayName?.replace(/[^a-zA-Z0-9]/g, '_') || 'User';
        const speakerId = `${speakerName}_${String(currentCount + 1).padStart(3, '0')}`;

        transaction.set(newRecordingRef, {
          ...fullMetadata,
          speakerId,
          audioBase64, 
          createdAt: Timestamp.now(),
          duration: duration,
        });

        transaction.update(userRef, { 
          recordingCount: currentCount + 1,
          totalDuration: currentDuration + duration,
        });
      });

      toast({ title: "Muvaffaqiyatli Saqlandi!", description: "Yangi yozuvingiz tizimga qo'shildi." });
      onRecordingSaved({ textId, emotion: forcedEmotion });

      setAudioBlob(null);

    } catch (error) {
      console.error("Error saving recording:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({ title: "Saqlashda Xatolik", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isClient) {
    return null; 
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        <div className="lg:col-span-3 bg-card p-6 rounded-lg shadow-sm border">
          <AudioRecorder onRecordingComplete={(blob, duration) => {
            setAudioBlob(blob);
            setDuration(duration);
          }} />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <MetadataForm onMetadataChange={handleMetadataChange} textId={textId} forcedEmotion={forcedEmotion} />
          </div>
           <Button 
            size="lg" 
            className="w-full mt-6 text-lg py-6 shadow-lg" 
            onClick={handleSave}
            disabled={isSaving || !audioBlob || !isMetadataValid}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <>
                Ma'lumotlarni Saqlash
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Muhim Eslatma */}
      <div className="mt-12 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-amber-800">{importantNote.title}</h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>{importantNote.description}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
