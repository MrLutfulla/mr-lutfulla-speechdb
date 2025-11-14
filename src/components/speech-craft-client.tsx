
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
  getDocs,
  runTransaction
} from "firebase/firestore";

/* ---------- Helper Functions ---------- */

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string): Blob {
    const [header, data] = base64.split(',');
    const mime = header.match(/:(.*?);/)?.[1];
    const bstr = atob(data);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}


/* ---------- Main Component ---------- */

export function SpeechCraftClient() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'new' | 'details'>('list');
  const [loading, setLoading] = useState(true);
  
  const { user } = useUser();
  const firestore = useFirestore();

  const isMobile = useIsMobile();
  
  useEffect(() => {
    setIsClient(true);
    if (!user || !firestore) return;

    setLoading(true);
    const recordingsCollection = collection(firestore, 'users', user.uid, 'recordings');
    const q = query(recordingsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Recording[] = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt: string;
        if (data.createdAt instanceof Timestamp) {
            createdAt = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
            createdAt = data.createdAt;
        } else {
            createdAt = new Date().toISOString(); // Fallback
        }
        return {
          ...data,
          id: doc.id,
          createdAt,
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
  const handleClearSelection = useCallback(() => {
    setSelectedRecordingId(null);
    setView('list');
  }, []);

  const handleSelectRecording = useCallback((id: string) => {
    setSelectedRecordingId(id);
    setView('details'); // Always switch to details view on selection
  }, []);

  const handleShowNewRecording = useCallback(() => {
    setSelectedRecordingId(null);
    setView('new');
  }, []);
  
  // This effect handles view changes when the screen size changes or selections are cleared.
  useEffect(() => {
    // If mobile, and the view is 'details' but there is no selected recording, go back to list.
    if (isMobile && view === 'details' && !selectedRecordingId) {
        setView('list');
    }
  }, [isMobile, selectedRecordingId, view]);


  /* --- Add Recording --- */
  const handleAddRecording = async (
    audioBlob: Blob,
    metadata: NewRecordingMetadata
  ) => {
     if (!user || !firestore) return;

    toast({ title: "Saqlanmoqda...", description: "Yozuvingiz serverga yuklanmoqda." });

    try {
      const audioBase64 = await blobToBase64(audioBlob);
      if (audioBase64.length > 1048576) {
          toast({ title: "Xatolik", description: "Ovoz yozuvi juda katta. Iltimos, qisqaroq yozuv yarating (taxminan 1 daqiqagacha).", variant: "destructive" });
          return;
      }
      
      const userRef = doc(firestore, 'users', user.uid);
      const recordingsCollection = collection(userRef, 'recordings');

      const docRef = await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw "Foydalanuvchi profili topilmadi!";
        }

        const userProfile = userDoc.data() as UserProfile;
        const currentRecordingCount = userProfile.recordingCount || 0;
        const newRecordingCount = currentRecordingCount + 1;

        // Use a sanitized display name and the new count for the speaker ID
        const speakerName = userProfile.displayName?.replace(/[^a-zA-Z0-9]/g, '_') || 'User';
        const speakerId = `${speakerName}_${String(newRecordingCount).padStart(2, '0')}`;
        
        const newRecordingDoc: Omit<Recording, 'id' | 'createdAt'> = {
          audioBase64,
          speakerId, // The new structured ID
          textId: metadata.textId,
          emotion: metadata.emotion,
          intensity: "normal", // Default, can be changed in the form
          gender: "male", // Default, can be changed in the form
          age: "18-25", // Default, can be changed in the form
          region: "toshkent", // Default, can be changed in the form
          personality: {
            extrovert: false, introvert: false, optimistic: false, emotional: false,
            calm: false, analytical: false, leader: false, compassionate: false,
          },
        };
        
        // Add the new recording document
        const newDocRef = doc(recordingsCollection); // Create a new doc reference with a generated ID
        transaction.set(newDocRef, {
            ...newRecordingDoc,
            createdAt: Timestamp.now(),
        });
        
        // Update the recording count on the user's profile
        transaction.update(userRef, { recordingCount: newRecordingCount });

        return newDocRef;
      });


      setSelectedRecordingId(docRef.id);
      setView('details');
      toast({ title: "Yozuv saqlandi", description: "Yangi yozuvingiz serverga qo'shildi." });

    } catch (error) {
      console.error("Error adding recording:", error);
      toast({ title: "Xatolik", description: `Yozuvni saqlashda xato yuz berdi: ${error}`, variant: "destructive" });
    }
  };

  /* --- Update Recording Metadata --- */
  const handleUpdateRecording = async (updatedRecording: Recording) => {
    if (!user || !firestore) return;
    
    const originalRecording = recordings.find(r => r.id === updatedRecording.id);
    if (!originalRecording) return;

    const { id, createdAt, ...dataToUpdate } = updatedRecording;
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
    
    toast({ title: "O'chirilmoqda..." });

    try {
      const userRef = doc(firestore, 'users', user.uid);
      const recordingRef = doc(userRef, 'recordings', id);

      await runTransaction(firestore, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
              throw "Foydalanuvchi profili topilmadi!";
          }

          transaction.delete(recordingRef);

          const currentCount = userDoc.data().recordingCount || 0;
          transaction.update(userRef, { recordingCount: Math.max(0, currentCount - 1) });
      });


      if (selectedRecordingId === id) handleClearSelection();
      toast({
        title: "Yozuv o'chirildi",
        description: "Tanlangan yozuv serverdan o'chirildi.",
      });
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast({ title: "Xatolik", description: `Yozuvni o'chirishda xato yuz berdi: ${error}`, variant: "destructive" });
    }
  };

  const handleClearAll = async () => {
    if (!user || !firestore) return;

    toast({ title: "Barcha yozuvlar o'chirilmoqda..." });
    
    try {
        const userRef = doc(firestore, 'users', user.uid);
        const recordingsRef = collection(userRef, 'recordings');
        
        const snapshot = await getDocs(recordingsRef);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        
        await Promise.all(deletePromises);

        await updateDoc(userRef, { recordingCount: 0 });

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
        const fileName = `${rec.speakerId}_${rec.id}.webm`;
        const { audioBase64, ...rest } = rec;
        
        metadata.push({ 
          ...rest, 
          fileName 
        });

        if (audioBase64) {
            const audioBlob = base64ToBlob(audioBase64);
            zip.file(fileName, audioBlob);
        }
      }

      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `speechcraft-export-${user?.displayName || 'user'}-${new Date().toISOString().split("T")[0]}.zip`;
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
  
  if (!isClient) return <div className="w-full h-screen bg-background" />;

  const showList = !isMobile || (isMobile && view === 'list');
  const showNewOrDetails = !isMobile || (isMobile && (view === 'details' || view === 'new'));

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

       <main className={cn("flex-1", showNewOrDetails ? "block" : "hidden md:block")}>
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
                isReadOnly={false}
              />
            )}
            {(view === 'list' || (view === 'details' && !selectedRecording)) && (
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

    