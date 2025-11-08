"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Recording, NewRecordingMetadata, UserProfile } from "@/lib/types";
import { RecordingList } from "@/components/recording-list";
import { RecordingDetails } from "@/components/recording-details";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Trash2, HardDriveUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NewRecording } from "@/components/new-recording";
import JSZip from "jszip";
import WavEncoder from "wav-encoder";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useUser, useFirestore } from "@/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  query,
  orderBy,
  getCountFromServer
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter } from "next/navigation";

/* ---------- Helper Functions ---------- */

async function convertWebmToWav(webmBlob: Blob): Promise<Blob> {
  try {
    const audioContext = new AudioContext({ sampleRate: 48000 });
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavBuffer = await WavEncoder.encode({
      sampleRate: 48000,
      channelData: Array.from({ length: audioBuffer.numberOfChannels }, (_, i) =>
        audioBuffer.getChannelData(i)
      ),
    });
    return new Blob([wavBuffer], { type: "audio/wav" });
  } catch (error) {
    console.error("Failed to convert WebM to WAV:", error);
    throw error;
  }
}

/* ---------- Main Component ---------- */

export function SpeechCraftClient() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'new' | 'details'>('list');
  const [loading, setLoading] = useState(true);
  
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const isMobile = useIsMobile();

  /* --- Mount: Load from Firestore --- */
  useEffect(() => {
    setIsClient(true);
    if (!user || !firestore) return;

    setLoading(true);
    const recordingsCollection = collection(firestore, 'users', user.uid, 'recordings');
    const q = query(recordingsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Recording[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        } as Recording;
      });
      setRecordings(loaded);
      setLoading(false);
    }, (error) => {
      console.error("Failed to load recordings:", error);
      toast({
        title: "Xatolik",
        description: "Yozuvlarni serverdan yuklab bo'lmadi.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore, toast]);

  /* --- View Management --- */
  const handleClearSelection = () => {
    setSelectedRecordingId(null);
    setView('list');
  };

  const handleSelectRecording = (id: string) => {
    setSelectedRecordingId(id);
    setView('details');
  };

  const handleShowNewRecording = () => {
    setSelectedRecordingId(null);
    setView('new');
  };

  /* --- Add Recording --- */
  const handleAddRecording = async (
    audioBlob: Blob,
    metadata: NewRecordingMetadata
  ) => {
    if (!user || !firestore) return;

    toast({ title: "Saqlanmoqda...", description: "Yozuvingiz serverga yuklanmoqda." });

    try {
      const recordingsCollection = collection(firestore, 'users', user.uid, 'recordings');
      const snapshot = await getCountFromServer(recordingsCollection);
      const nextIdNumber = snapshot.data().count + 1;
      
      const speakerId = `UZ_${String(nextIdNumber).padStart(2, '0')}`;
      const recordingId = `${speakerId}_${metadata.textId}_${metadata.emotion}_${Date.now()}`;
      
      // 1. Upload audio file to Firebase Storage
      const storage = getStorage();
      const storagePath = `recordings/${user.uid}/${recordingId}.wav`;
      const storageRef = ref(storage, storagePath);
      const wavBlob = await convertWebmToWav(audioBlob);
      await uploadBytes(storageRef, wavBlob);
      const audioUrl = await getDownloadURL(storageRef);

      // 2. Save metadata to Firestore
      const newRecordingDoc: Omit<Recording, 'id' | 'createdAt'> = {
        audioUrl,
        storagePath,
        speakerId,
        textId: metadata.textId,
        emotion: metadata.emotion,
        intensity: "normal", // Default value
        gender: "male", // Default value
        age: "18-25", // Default value
        region: "toshkent", // Default value
        personality: { // Default value
          extrovert: false, introvert: false, optimistic: false, emotional: false,
          calm: false, analytical: false, leader: false, compassionate: false,
        },
      };

      const docRef = await addDoc(recordingsCollection, {
        ...newRecordingDoc,
        createdAt: Timestamp.now(),
      });

      setSelectedRecordingId(docRef.id);
      setView('details');
      toast({ title: "Yozuv saqlandi", description: "Yangi yozuvingiz serverga qo'shildi." });

    } catch (error) {
      console.error("Error adding recording:", error);
      toast({ title: "Xatolik", description: "Yozuvni saqlashda xato yuz berdi.", variant: "destructive" });
    }
  };

  /* --- Update Recording Metadata --- */
  const handleUpdateRecording = async (updatedRecording: Omit<Recording, 'createdAt'>) => {
    if (!user || !firestore) return;
    const { id, ...dataToUpdate } = updatedRecording;
    const docRef = doc(firestore, 'users', user.uid, 'recordings', id);
    
    try {
      await updateDoc(docRef, dataToUpdate);
      toast({
        title: "Ma'lumotlar yangilandi",
        description: "O'zgarishlaringiz saqlandi.",
      });
    } catch(error) {
      console.error("Error updating recording:", error);
      toast({ title: "Xatolik", description: "Yangilanishni saqlab bo'lmadi.", variant: "destructive" });
    }
  };

  /* --- Delete Recording --- */
  const handleDeleteRecording = async (id: string) => {
    if (!user || !firestore) return;
    
    const recordingToDelete = recordings.find(r => r.id === id);
    if (!recordingToDelete) return;

    toast({ title: "O'chirilmoqda..." });

    try {
      // 1. Delete file from Storage
      const storage = getStorage();
      const storageRef = ref(storage, recordingToDelete.storagePath);
      await deleteObject(storageRef);

      // 2. Delete doc from Firestore
      const docRef = doc(firestore, 'users', user.uid, 'recordings', id);
      await deleteDoc(docRef);

      if (selectedRecordingId === id) handleClearSelection();
      toast({
        title: "Yozuv o'chirildi",
        description: "Tanlangan yozuv serverdan o'chirildi.",
      });
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast({ title: "Xatolik", description: "Yozuvni o'chirishda xato yuz berdi.", variant: "destructive" });
    }
  };

  const handleClearAll = async () => {
    if (!user || !firestore) return;

    toast({ title: "Barcha yozuvlar o'chirilmoqda..." });

    // This is a batch operation, proceed with caution.
    const deletePromises = recordings.map(rec => handleDeleteRecording(rec.id));
    try {
      await Promise.all(deletePromises);
      handleClearSelection();
      toast({
        title: 'Barcha yozuvlar o‘chirildi',
        description: 'Barcha saqlangan ma’lumotlar tozalandi.',
      });
    } catch (error) {
       console.error("Error clearing all recordings:", error);
       toast({ title: "Xatolik", description: "Yozuvlarni o'chirishda xato yuz berdi.", variant: "destructive" });
    }
  };

 /* --- Export All Recordings --- */
 const handleExport = async () => {
    if (recordings.length === 0) {
      toast({
        title: "Eksport uchun ma'lumot yo'q",
        description: "Hech qanday yozuv mavjud emas.",
      });
      return;
    }

    toast({
      title: "Eksport qilinmoqda...",
      description: "Yozuvlaringiz tayyorlanmoqda, iltimos kuting.",
    });

    try {
      const zip = new JSZip();
      const metadata: any[] = [];

      for (const rec of recordings) {
        const fileName = `${rec.id.replace(/[^a-zA-Z0-9_.-]/g, '_')}.wav`;
        const { audioUrl, storagePath, createdAt, ...rest } = rec;
        
        metadata.push({ 
          ...rest, 
          createdAt: (createdAt as string), // Already a string
          fileName 
        });

        const response = await fetch(audioUrl);
        const wavBlob = await response.blob();
        
        zip.file(fileName, wavBlob);
      }

      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `speechcraft-export-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Eksport muvaffaqiyatli",
        description: "Barcha yozuvlar va ma'lumotlar ZIP faylga saqlandi.",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Eksportda xatolik",
        description: "Ma'lumotlarni eksport qilishda kutilmagan xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };


  const selectedRecording = useMemo(
    () => recordings.find((r) => r.id === selectedRecordingId),
    [recordings, selectedRecordingId]
  );
  
  if (!isClient || userLoading) return <div className="w-full h-screen bg-background" />;

  const showList = !isMobile || (isMobile && view === 'list');
  const showDetails = !isMobile || (isMobile && (view === 'details' || view === 'new'));

  return (
    <div className="flex h-full overflow-hidden">
      <div className={cn("flex-col border-r bg-card w-full md:w-96 shrink-0", showList ? "flex" : "hidden md:flex")}>
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-headline font-bold">Yozuvlar</h2>
           <div className="flex items-center gap-2">
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={recordings.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" /> Tozalash
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Haqiqatan ham oʻchirmoqchimisiz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu amalni qaytarib boʻlmaydi. Bu barcha yozuvlarni serverdan butunlay oʻchirib tashlaydi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                    O'chirish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleExport} variant="outline" size="sm" disabled={recordings.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Eksport
            </Button>
          </div>
        </div>
        <RecordingList
          recordings={recordings}
          selectedRecordingId={selectedRecordingId}
          onSelectRecording={handleSelectRecording}
          loading={loading}
        />
        <div className="p-4 border-t">
           <Button onClick={handleShowNewRecording} size="lg" className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> Yangi yozuv
          </Button>
        </div>
      </div>

       <main className={cn("flex-1", showDetails ? "block" : "hidden md:block")}>
        <ScrollArea className="h-full">
         <div className="p-4 md:p-8">
            {view === 'new' && (
              <NewRecording onSaveRecording={handleAddRecording} onBack={handleClearSelection} />
            )}
            {view === 'details' && selectedRecording && (
               <RecordingDetails
                key={selectedRecording.id}
                recording={selectedRecording}
                onUpdateRecording={handleUpdateRecording}
                onDeleteRecording={handleDeleteRecording}
                onClearSelection={handleClearSelection}
              />
            )}
            {view === 'list' && !selectedRecording && (
               <div className="hidden md:flex h-full flex-col items-center justify-center bg-background text-muted-foreground p-8 min-h-[calc(100vh-10rem)]">
                  <HardDriveUpload className="w-16 h-16 mb-4 text-muted-foreground/50" />
                  <h2 className="text-xl font-medium">Yozuvni tanlang</h2>
                  <p>Ko'rish yoki tahrirlash uchun ro'yxatdan yozuvni tanlang.</p>
                  <span className="text-sm mt-4">yoki</span>
                  <Button onClick={handleShowNewRecording} variant="ghost" className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Yangi yozuv yarating
                  </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
