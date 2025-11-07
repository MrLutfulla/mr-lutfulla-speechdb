"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Recording, StoredRecording, NewRecordingMetadata } from "@/lib/types";
import { RecordingList } from "@/components/recording-list";
import { RecordingDetails } from "@/components/recording-details";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NewRecording } from "@/components/new-recording";
import JSZip from "jszip";
import WavEncoder from "wav-encoder";
import { cn } from "@/lib/utils";

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
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'details'>('list');

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
        title: "Error",
        description: "Could not load recordings from your browser storage.",
        variant: "destructive",
      });
    }
  }, []);

  /* --- Unmount: Cleanup object URLs --- */
  useEffect(() => {
    return () => {
      recordings.forEach((r) => URL.revokeObjectURL(r.audioUrl));
    };
  }, [recordings]);

  /* --- View Management --- */
  useEffect(() => {
    if(selectedRecordingId !== null) {
      setView('details');
    }
  }, [selectedRecordingId]);

  const handleClearSelection = () => {
    setSelectedRecordingId(null);
    setView('list');
  }

  const handleSelectRecording = (id: string) => {
    setSelectedRecordingId(id);
    setView('details');
  }

  const handleShowNewRecording = () => {
    setSelectedRecordingId(null);
    setView('details');
  }


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
          title: "Error",
          description: "Could not save recordings to your browser storage.",
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
    const nextId = recordings.length > 0 ? Math.max(...recordings.map(r => parseInt(r.speakerId.split('_')[1] || '0'))) + 1 : 1;

    const speakerId = `UZ_${String(nextId).padStart(2, '0')}`;
    const textId = 'text_new';

    const id = `${speakerId}_${textId}_${metadata.emotion}_${Date.now()}`;

    const newRecording: Recording = {
      id,
      speakerId,
      textId,
      emotion: metadata.emotion,
      intensity: 'normal',
      gender: 'male',
      age: '18-25',
      region: 'toshkent',
      personality: {
        openness: false,
        conscientiousness: false,
        extraversion: false,
        agreeableness: false,
        neuroticism: false,
      },
      audioUrl: URL.createObjectURL(audioBlob),
      createdAt: new Date().toISOString(),
    };

    const updated = [...recordings, newRecording];
    setRecordings(updated);
    await updateLocalStorage(updated);

    setSelectedRecordingId(newRecording.id);
    setView('details');
    toast({ title: "Recording Saved", description: "Your new recording has been added." });
  };

  /* --- Update Recording Metadata --- */
  const handleUpdateRecording = async (updatedRecording: Recording) => {
    const updated = recordings.map((r) => (r.id === updatedRecording.id ? updatedRecording : r));
    setRecordings(updated);
    await updateLocalStorage(updated);
    toast({ title: "Metadata Updated", description: "Your changes have been saved." });
  };

  /* --- Delete Recording --- */
  const handleDeleteRecording = async (id: string) => {
    const target = recordings.find((r) => r.id === id);
    if (target?.audioUrl) URL.revokeObjectURL(target.audioUrl);

    const updated = recordings.filter((r) => r.id !== id);
    setRecordings(updated);
    await updateLocalStorage(updated);

    if (selectedRecordingId === id) handleClearSelection();
    toast({ title: "Recording Deleted", description: "The recording has been removed." });
  };

  /* --- Export All Recordings --- */
  const handleExport = async () => {
    if (recordings.length === 0) {
      toast({ title: "Nothing to Export", description: "No recordings to export." });
      return;
    }

    toast({ title: "Exporting...", description: "Preparing your recordings..." });
    try {
      const zip = new JSZip();
      const metadata: any[] = [];
      const usedFileNames = new Set<string>();

      for (const rec of recordings) {
        // Extract the base speaker ID like "UZ_01" from a potentially longer string
        const baseSpeakerIdMatch = rec.speakerId.match(/^UZ_\d+/);
        const baseSpeakerId = baseSpeakerIdMatch ? baseSpeakerIdMatch[0] : rec.speakerId;
        
        let baseName = `${baseSpeakerId}_${rec.textId}_${rec.emotion}_${rec.intensity}`;
        let fileName = `${baseName}.wav`;
        let counter = 1;
        
        // Ensure the filename is unique
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
      a.download = `speechcraft-export-${new Date().toISOString().split("T")[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export Successful", description: "ZIP file downloaded." });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting your data.",
        variant: "destructive",
      });
    }
  };

  const selectedRecording = useMemo(
    () => recordings.find((r) => r.id === selectedRecordingId),
    [recordings, selectedRecordingId]
  );

  if (!isClient) return <div className="w-full h-full bg-background" />;

  const Sidebar = () => (
     <div className="flex flex-col border-r bg-card h-full">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center gap-2">
          <h2 className="text-lg font-headline font-semibold">Recordings</h2>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>

        {/* Recording List */}
        <div className="flex-1 overflow-y-auto">
          <RecordingList
            recordings={recordings}
            selectedRecordingId={selectedRecordingId}
            onSelectRecording={handleSelectRecording}
          />
        </div>
        
        {/* Footer with New Button */}
        <div className="p-4 border-t flex justify-start">
           <Button onClick={handleShowNewRecording} size="lg" className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> New Recording
            </Button>
        </div>
      </div>
  );

  const MainPanel = () => (
     <div className="p-4 md:p-8 overflow-y-auto h-full">
        {selectedRecording ? (
          <RecordingDetails
            key={selectedRecording.id}
            recording={selectedRecording}
            onUpdateRecording={handleUpdateRecording}
            onDeleteRecording={handleDeleteRecording}
            onClearSelection={handleClearSelection}
          />
        ) : (
          <NewRecording onSaveRecording={handleAddRecording} onBack={handleClearSelection} />
        )}
      </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full">
      {/* Mobile View */}
      <div className="md:hidden h-full">
        {view === 'list' ? <Sidebar /> : <MainPanel />}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block h-full">
         <Sidebar />
      </div>
       <div className="hidden md:block h-full">
         <MainPanel />
      </div>
    </div>
  );
}
