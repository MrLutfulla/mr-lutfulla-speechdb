'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Recording, StoredRecording } from '@/lib/types';
import { RecordingList } from '@/components/recording-list';
import { RecordingDetails } from '@/components/recording-details';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewRecording } from '@/components/new-recording';
import JSZip from 'jszip';
import WavEncoder from 'wav-encoder';

const LOCAL_STORAGE_KEY = 'speechcraft-recordings';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
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

  return new Blob([wavBuffer], { type: 'audio/wav' });
}


export function SpeechCraftClient() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const storedRecordings: StoredRecording[] = JSON.parse(stored);
        const loadedRecordings = storedRecordings.map((rec) => {
          const audioBlob = base64ToBlob(rec.audioBase64);
          const audioUrl = URL.createObjectURL(audioBlob);
          return { ...rec, audioUrl };
        });
        setRecordings(loadedRecordings);
      }
    } catch (error) {
      console.error('Failed to load recordings from local storage', error);
      toast({
        title: 'Error',
        description: 'Could not load recordings from your browser storage.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  useEffect(() => {
    return () => {
      recordings.forEach(rec => URL.revokeObjectURL(rec.audioUrl));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLocalStorage = useCallback(
    async (updatedRecordings: Recording[]) => {
      try {
        const recordingsToStore: StoredRecording[] = await Promise.all(
          updatedRecordings.map(async (rec) => {
            if (rec.audioUrl.startsWith('blob:')) {
              const response = await fetch(rec.audioUrl);
              const blob = await response.blob();
              const audioBase64 = await blobToBase64(blob);
              const { audioUrl, ...rest } = rec;
              return {
                ...rest,
                audioBase64,
              };
            }
            // If it's not a blob URL, it's already a base64 string from a previous load
            // This logic is flawed, let's fix it by re-fetching the blob every time.
            const response = await fetch(rec.audioUrl);
            const blob = await response.blob();
            const audioBase64 = await blobToBase64(blob);
            const { audioUrl, ...rest } = rec;
            return {
              ...rest,
              audioBase64: audioBase64,
            };
          })
        );
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(recordingsToStore)
        );
      } catch (error) {
        console.error('Failed to save recordings to local storage', error);
        toast({
          title: 'Error',
          description: 'Could not save recordings to your browser storage.',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const handleAddRecording = async (audioBlob: Blob, metadata: Omit<Recording, 'id' | 'audioUrl' | 'createdAt'>) => {
    const newId = `${metadata.speakerId}_${metadata.textId}_${metadata.emotion}_${metadata.intensity}_${Date.now()}`;
    const newRecording: Recording = {
      id: newId,
      ...metadata,
      speakerId: `${metadata.speakerId}_${metadata.textId}_${metadata.emotion}_${metadata.intensity}`,
      audioUrl: URL.createObjectURL(audioBlob),
      createdAt: new Date().toISOString(),
    };
    
    const updatedRecordings = [...recordings, newRecording];
    setRecordings(updatedRecordings);
    await updateLocalStorage(updatedRecordings);
    setSelectedRecordingId(newRecording.id);
    toast({
      title: 'Recording Saved',
      description: 'Your new recording has been added.',
    });
  };

  const handleUpdateRecording = async (updatedRecording: Recording) => {
    const updatedRecordings = recordings.map((rec) =>
      rec.id === updatedRecording.id ? updatedRecording : rec
    );
    setRecordings(updatedRecordings);
    await updateLocalStorage(updatedRecordings);
    toast({
      title: 'Metadata Updated',
      description: 'Your changes have been saved.',
    });
  };

  const handleDeleteRecording = async (id: string) => {
    const recordingToDelete = recordings.find((r) => r.id === id);
    if (recordingToDelete?.audioUrl) {
      URL.revokeObjectURL(recordingToDelete.audioUrl);
    }
    const updatedRecordings = recordings.filter((rec) => rec.id !== id);
    setRecordings(updatedRecordings);
    if (selectedRecordingId === id) {
      setSelectedRecordingId(null);
    }
    await updateLocalStorage(updatedRecordings);
    toast({
      title: 'Recording Deleted',
      description: 'The recording has been permanently removed.',
    });
  };

  const handleExport = async () => {
    if (recordings.length === 0) {
      toast({
        title: 'Nothing to Export',
        description: 'There are no recordings to export.',
      });
      return;
    }
    toast({
      title: 'Exporting...',
      description: 'Preparing your recordings. This may take a moment.',
    });
    try {
      const zip = new JSZip();
      const metadata = [];

      for (const rec of recordings) {
        const fileName = `${rec.speakerId}.wav`;
        const { audioUrl, id, ...rest } = rec;
        
        metadata.push({ ...rest, id, fileName });

        const response = await fetch(rec.audioUrl);
        const webmBlob = await response.blob();
        const wavBlob = await convertWebmToWav(webmBlob);
        
        zip.file(fileName, wavBlob);
      }
      
      const jsonString = JSON.stringify(metadata, null, 2);
      zip.file('metadata.json', jsonString);
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speechcraft-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Your data has been exported as a ZIP file.',
      });
    } catch (error) {
      console.error('Failed to export data', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting your data.',
        variant: 'destructive',
      });
    }
  };
  
  const handleClearSelection = () => {
    setSelectedRecordingId(null);
  }

  const selectedRecording = useMemo(() => recordings.find(
    (rec) => rec.id === selectedRecordingId
  ), [recordings, selectedRecordingId]);

  if (!isClient) {
    return <div className="w-full h-full bg-background" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full">
      <div className="flex flex-col border-r bg-card h-full">
        <div className="p-4 border-b flex justify-between items-center gap-2">
          <h2 className="text-lg font-headline font-semibold">Recordings</h2>
          <div className="flex items-center gap-2">
            <Button onClick={() => setSelectedRecordingId(null)} variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              New
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        <RecordingList
          recordings={recordings}
          selectedRecordingId={selectedRecordingId}
          onSelectRecording={(id) => setSelectedRecordingId(id)}
        />
      </div>
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
          <NewRecording onSaveRecording={handleAddRecording} recordings={recordings}/>
        )}
      </div>
    </div>
  );
}
