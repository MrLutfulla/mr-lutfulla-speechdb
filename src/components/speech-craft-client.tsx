'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, runTransaction, collection, Timestamp, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder } from '@/components/audio-recorder'; 
import { MetadataForm } from '@/components/metadata-form';
import { NewRecordingMetadata, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function SpeechCraftClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [metadata, setMetadata] = useState<NewRecordingMetadata | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSave = async () => {
    if (!user || !firestore) {
      toast({ title: "Xatolik", description: "Foydalanuvchi tizimga kirmagan.", variant: "destructive" });
      return;
    }
    if (!audioBlob) {
      toast({ title: "Ovoz yozilmagan", description: "Iltimos, avval ovozingizni yozing.", variant: "destructive" });
      return;
    }
    if (!metadata) {
      toast({ title: "Ma'lumotlar to'ldirilmagan", description: "Iltimos, barcha kerakli ma'lumotlarni kiriting.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    toast({ title: "Saqlanmoqda...", description: "Yozuvingiz serverga yuklanmoqda." });

    try {
      const audioBase64 = await blobToBase64(audioBlob);
      if (audioBase64.length > 1572864) { // ~1.5 MB limit
        toast({ title: "Xatolik", description: "Ovoz yozuvi juda katta (1.5MB dan oshmasligi kerak).", variant: "destructive" });
        setIsSaving(false);
        return;
      }

      const userRef = doc(firestore, 'users', user.uid);

      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("Foydalanuvchi profili topilmadi!");

        const userProfile = userDoc.data() as UserProfile;
        const currentCount = userProfile.recordingCount || 0;
        const newCount = currentCount + 1;
        
        const recordingsCollection = collection(userRef, 'recordings');
        const newRecordingRef = doc(recordingsCollection);

        const speakerName = userProfile.displayName?.replace(/[^a-zA-Z0-9]/g, '_') || 'User';
        const speakerId = `${speakerName}_${String(newCount).padStart(3, '0')}`;

        transaction.set(newRecordingRef, {
          ...metadata,
          speakerId,
          audioBase64, 
          createdAt: Timestamp.now(),
        });

        transaction.update(userRef, { recordingCount: newCount });
      });

      toast({ title: "Muvaffaqiyatli Saqlandi!", description: "Yangi yozuvingiz tizimga qo'shildi." });
      setAudioBlob(null);
      // Keep metadata for next recording, or reset it
      // setMetadata(null); 

    } catch (error) {
      console.error("Error saving recording:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({ title: "Saqlashda Xatolik", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Side: Audio Recorder */}
        <div className="lg:col-span-3 bg-card p-6 rounded-lg shadow-sm border">
          <AudioRecorder onRecordingComplete={setAudioBlob} />
        </div>

        {/* Right Side: Metadata Form */}
        <div className="lg:col-span-2">
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <MetadataForm onMetadataChange={setMetadata} />
          </div>
           <Button 
            size="lg" 
            className="w-full mt-6 text-lg py-6 shadow-lg" 
            onClick={handleSave}
            disabled={isSaving || !audioBlob || !metadata}
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
    </div>
  );
}
