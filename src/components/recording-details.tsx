'use client';

import { Recording } from '@/lib/types';
import { AudioRecorder } from './audio-recorder';
import { AudioPlayer } from './audio-player';
import { MetadataForm } from './metadata-form';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
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

interface RecordingDetailsProps {
  recording: Recording | undefined;
  onSaveRecording: (blob: Blob) => void;
  onUpdateRecording: (recording: Recording) => void;
  onDeleteRecording: (id: string) => void;
  onClearSelection: () => void;
}

export function RecordingDetails({
  recording,
  onSaveRecording,
  onUpdateRecording,
  onDeleteRecording,
  onClearSelection,
}: RecordingDetailsProps) {
  if (!recording) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-card p-8 rounded-lg border-2 border-dashed border-muted">
        <h2 className="text-2xl font-headline font-semibold mb-2">New Recording</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Click the button below to start recording new audio using your device's microphone.
        </p>
        <AudioRecorder onSave={onSaveRecording} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold">
            {recording.speakerId}
          </h2>
          <p className="text-muted-foreground">
            Recorded on {new Date(recording.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={onClearSelection}>
              <X className="h-5 w-5" />
              <span className="sr-only">Go back</span>
            </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Recording</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  recording and its metadata from your browser storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteRecording(recording.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <AudioPlayer audioUrl={recording.audioUrl} />

      <MetadataForm recording={recording} onSave={onUpdateRecording} />
    </div>
  );
}
