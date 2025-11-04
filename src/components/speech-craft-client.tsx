'use client';

import { useState, useEffect, useCallback } from 'react';
import { Recording, StoredRecording } from '@/lib/types';
import { RecordingList } from '@/components/recording-list';
import { RecordingDetails } from '@/components/recording-details';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export function SpeechCraftClient() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(
    null
  );
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
            const response = await fetch(rec.audioUrl);
            const blob = await response.blob();
            const audioBase64 = await blobToBase64(blob);
            return {
              id: rec.id,
              speakerId: rec.speakerId,
              transcription: rec.transcription,
              createdAt: rec.createdAt,
              audioBase64,
              labels: rec.labels,
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

  const handleAddRecording = async (audioBlob: Blob) => {
    const newRecording: Recording = {
      id: `rec-${Date.now()}`,
      audioUrl: URL.createObjectURL(audioBlob),
      speakerId: `Speaker ${recordings.length + 1}`,
      transcription: '',
      createdAt: new Date().toISOString(),
      labels: [],
    };
    const updatedRecordings = [...recordings, newRecording];
    setRecordings(updatedRecordings);
    setSelectedRecordingId(newRecording.id);
    updateLocalStorage(updatedRecordings);
    toast({
      title: 'Recording Saved',
      description: 'Your new recording has been added.',
    });
  };

  const handleUpdateRecording = (updatedRecording: Recording) => {
    const updatedRecordings = recordings.map((rec) =>
      rec.id === updatedRecording.id ? updatedRecording : rec
    );
    setRecordings(updatedRecordings);
    updateLocalStorage(updatedRecordings);
    toast({
      title: 'Metadata Updated',
      description: 'Your changes have been saved.',
    });
  };

  const handleDeleteRecording = (id: string) => {
    const recordingToDelete = recordings.find((r) => r.id === id);
    if (recordingToDelete?.audioUrl) {
      URL.revokeObjectURL(recordingToDelete.audioUrl);
    }
    const updatedRecordings = recordings.filter((rec) => rec.id !== id);
    setRecordings(updatedRecordings);
    if (selectedRecordingId === id) {
      setSelectedRecordingId(null);
    }
    updateLocalStorage(updatedRecordings);
    toast({
      title: 'Recording Deleted',
      description: 'The recording has been permanently removed.',
      variant: 'destructive',
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
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const dataToExport = stored ? JSON.parse(stored) : [];
      
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speechcraft-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Export Successful',
        description: 'Your data has been exported as a JSON file.',
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

  const selectedRecording = recordings.find(
    (rec) => rec.id === selectedRecordingId
  );

  if (!isClient) {
    return <div className="w-full h-full bg-background" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full">
      <div className="flex flex-col border-r bg-card h-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-headline font-semibold">Recordings</h2>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
        <RecordingList
          recordings={recordings}
          selectedRecordingId={selectedRecordingId}
          onSelectRecording={(id) => setSelectedRecordingId(id)}
        />
      </div>
      <div className="p-4 md:p-8 overflow-y-auto h-full">
        <RecordingDetails
          key={selectedRecording?.id ?? 'new'}
          recording={selectedRecording}
          onSaveRecording={handleAddRecording}
          onUpdateRecording={handleUpdateRecording}
          onDeleteRecording={handleDeleteRecording}
          onClearSelection={handleClearSelection}
        />
      </div>
    </div>
  );
}
