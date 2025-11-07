'use client';

import { Recording } from '@/lib/types';
import { AudioPlayer } from './audio-player';
import { MetadataForm } from './metadata-form';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft } from 'lucide-react';
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
  recording: Recording;
  onUpdateRecording: (recording: Recording) => void;
  onDeleteRecording: (id: string) => void;
  onClearSelection: () => void;
}

export function RecordingDetails({
  recording,
  onUpdateRecording,
  onDeleteRecording,
  onClearSelection,
}: RecordingDetailsProps) {

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div className='flex items-center gap-4'>
           <Button variant="ghost" size="icon" onClick={onClearSelection} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Go back to list</span>
            </Button>
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-bold">
              {recording.speakerId || 'No ID'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Recorded on {new Date(recording.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      <MetadataForm 
        recording={recording} 
        onSave={onUpdateRecording}
        isNewRecording={false}
       />
    </div>
  );
}
