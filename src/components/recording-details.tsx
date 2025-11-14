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
  isReadOnly?: boolean;
}

export function RecordingDetails({
  recording,
  onUpdateRecording,
  onDeleteRecording,
  onClearSelection,
  isReadOnly = false,
}: RecordingDetailsProps) {

  // Ensure createdAt is always a Date object before passing to components
  const createdAtDate = typeof recording.createdAt === 'string' 
    ? new Date(recording.createdAt) 
    : (recording.createdAt as any).toDate(); // Handle Firebase Timestamp

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
              {createdAtDate.toLocaleString()} yozilgan
            </p>
          </div>
        </div>
        {!isReadOnly && (
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
                  <AlertDialogTitle>Haqiqatan ham oʻchirmoqchimisiz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu amalni qaytarib boʻlmaydi. Bu yozuvni serverdan butunlay oʻchirib tashlaydi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteRecording(recording.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    O'chirish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <AudioPlayer audioUrl={recording.audioBase64} />

      <MetadataForm 
        recording={recording} 
        onSave={onUpdateRecording}
        isNewRecording={false}
        isReadOnly={isReadOnly}
       />
    </div>
  );
}
