"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Recording, StoredRecording, NewRecordingMetadata } from "@/lib/types";
import { RecordingList } from "@/components/recording-list";
import { RecordingDetails } from "@/components/recording-details";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NewRecording } from "@/components/new-recording";
import JSZip from "jszip";
import WavEncoder from "wav-encoder";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const LOCAL_STORAGE_KEY = "speechcraft-recordings";

/* ---------- Helper Functions ---------- */

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const base64ToBlob = (base64: string): Blob => {
  const [prefix, data] = base64.split(";base64,");
  const contentType = prefix.split(":")[1];
  const byteCharacters = atob(data);
  const byteNumbers = new Array(byteCharacters.length)
    .fill(0)
    .map((_, i) => byteCharacters.charCodeAt(i));
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
};

async function convertWebmToWav(webmBlob: Blob): Promise<Blob> {
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
}

/* ---------- Main Component ---------- */

export function SpeechCraftClient() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(
    null
  );
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'new' | 'details'>('list');
  const isMobile = useMemo(() => {
      if (typeof window === 'undefined') return false;
      return window.innerWidth < 768;
  }, [isClient]);


  /* --- Mount: Load from LocalStorage --- */
  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const storedRecordings: StoredRecording[] = JSON.parse(stored);
        const loaded = storedRecordings.map((rec) => {
          const audioBlob = base64ToBlob(rec.audioBase64);
          const audioUrl = URL.createObjectURL(audioBlob);
          return { ...rec, audioUrl };
        });
        setRecordings(loaded);
      }
    } catch (err) {
      console.error("Failed to load recordings:", err);
      toast({
        title: "Xatolik",
        description: "Yozuvlarni brauzer xotirasidan yuklab bo'lmadi.",
        variant: "destructive",
      });
    }
  }, [toast]);

  /* --- Unmount: Cleanup object URLs --- */
  useEffect(() => {
    return () => {
      recordings.forEach((r) => URL.revokeObjectURL(r.audioUrl));
    };
  }, [recordings]);

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

  /* --- Save to LocalStorage --- */
  const updateLocalStorage = useCallback(
    async (list: Recording[]) => {
      try {
        const toStore: StoredRecording[] = await Promise.all(
          list.map(async (rec) => {
            const response = await fetch(rec.audioUrl);
            const blob = await response.blob();
            const audioBase64 = await blobToBase64(blob);
            const { audioUrl, ...rest } = rec;
            return { ...rest, audioBase64 };
          })
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toStore));
      } catch (err) {
        console.error("Failed to save:", err);
        toast({
          title: "Xatolik",
          description: "Yozuvlarni brauzer xotirasiga saqlab bo'lmadi.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  /* --- Add Recording --- */
  const handleAddRecording = async (
    audioBlob: Blob,
    metadata: NewRecordingMetadata
  ) => {
    const nextIdNumber =
      recordings.length > 0
        ? Math.max(
            ...recordings.map((r) => parseInt(r.speakerId.split("_")[1] || "0"))
          ) + 1
        : 1;

    const speakerId = `UZ_${String(nextIdNumber).padStart(2, "0")}`;
    const textId = "text_new";

    const id = `${speakerId}_${textId}_${metadata.emotion}_${Date.now()}`;

    const newRecording: Recording = {
      id,
      speakerId,
      textId,
      emotion: metadata.emotion,
      intensity: "normal",
      gender: "male", // Default, can be changed in details
      age: "18-25", // Default
      region: "toshkent", // Default
      personality: {
        extrovert: false,
        introvert: false,
        optimistic: false,
        emotional: false,
        calm: false,
        analytical: false,
        leader: false,
        compassionate: false,
      },
      audioUrl: URL.createObjectURL(audioBlob),
      createdAt: new Date().toISOString(),
    };

    const updated = [...recordings, newRecording];
    setRecordings(updated);
    await updateLocalStorage(updated);

    setSelectedRecordingId(newRecording.id);
    setView('details');
    toast({ title: "Yozuv saqlandi", description: "Yangi yozuvingiz qo'shildi." });
  };

  /* --- Update Recording Metadata --- */
  const handleUpdateRecording = async (updatedRecording: Recording) => {
    const updated = recordings.map((r) =>
      r.id === updatedRecording.id ? updatedRecording : r
    );
    setRecordings(updated);
    await updateLocalStorage(updated);
    toast({
      title: "Ma'lumotlar yangilandi",
      description: "O'zgarishlaringiz saqlandi.",
    });
  };

  /* --- Delete Recording --- */
  const handleDeleteRecording = async (id: string) => {
    const target = recordings.find((r) => r.id === id);
    if (target?.audioUrl) URL.revokeObjectURL(target.audioUrl);

    const updated = recordings.filter((r) => r.id !== id);
    setRecordings(updated);
    await updateLocalStorage(updated);

    if (selectedRecordingId === id) handleClearSelection();
    toast({
      title: "Yozuv o'chirildi",
      description: "Tanlangan yozuv o'chirildi.",
    });
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
      description: "Yozuvlaringiz tayyorlanmoqda...",
    });
    try {
      const zip = new JSZip();
      const metadata: any[] = [];
      const usedFileNames = new Set<string>();

      for (const rec of recordings) {
        const baseSpeakerIdMatch = rec.speakerId.match(/^UZ_\d+/);
        const baseSpeakerId = baseSpeakerIdMatch
          ? baseSpeakerIdMatch[0]
          : rec.speakerId;

        let baseName = `${baseSpeakerId}_${rec.textId}_${rec.emotion}_${rec.intensity}`;
        let fileName = `${baseName}.wav`;
        let counter = 1;

        while (usedFileNames.has(fileName)) {
          fileName = `${baseName}_(${counter}).wav`;
          counter++;
        }
        usedFileNames.add(fileName);

        const { audioUrl, id, ...rest } = rec;

        metadata.push({ ...rest, id, fileName });

        const response = await fetch(audioUrl);
        const webmBlob = await response.blob();
        const wavBlob = await convertWebmToWav(webmBlob);
        zip.file(fileName, wavBlob);
      }

      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `speechcraft-export-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Eksport muvaffaqiyatli",
        description: "ZIP fayl yuklab olindi.",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Eksportda xatolik",
        description: "Ma'lumotlarni eksport qilishda xatolik yuz berdi.",
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
  const showDetails = !isMobile || (isMobile && (view === 'details' || view === 'new'));

  return (
    <div className="flex h-screen">
      <div className={cn("flex flex-col border-r bg-card w-[350px] shrink-0", showList ? "flex" : "hidden md:flex")}>
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-headline font-bold">Yozuvlar</h2>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Eksport
          </Button>
        </div>
        <RecordingList
          recordings={recordings}
          selectedRecordingId={selectedRecordingId}
          onSelectRecording={handleSelectRecording}
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
