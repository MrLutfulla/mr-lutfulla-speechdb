'use client';

import { Recording } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Mic2 } from 'lucide-react';

interface RecordingListProps {
  recordings: Recording[];
  selectedRecordingId: string | null;
  onSelectRecording: (id: string) => void;
}

export function RecordingList({
  recordings,
  selectedRecordingId,
  onSelectRecording,
}: RecordingListProps) {
  const sortedRecordings = [...recordings].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ScrollArea className="flex-1">
      {sortedRecordings.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground flex flex-col items-center justify-center h-full">
          <Mic2 className="w-16 h-16 mb-4 text-muted-foreground/50" />
          <p className="font-semibold">No recordings yet</p>
          <p className="text-sm">Create a new recording to get started.</p>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {sortedRecordings.map((recording) => (
            <button
              key={recording.id}
              onClick={() => onSelectRecording(recording.id)}
              className={cn(
                'w-full text-left p-3 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'hover:bg-accent/20',
                selectedRecordingId === recording.id
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-transparent'
              )}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium truncate">{recording.speakerId || 'No ID'}</p>
                <time
                  className={cn(
                    'text-xs',
                    selectedRecordingId === recording.id
                      ? 'text-accent-foreground/80'
                      : 'text-muted-foreground'
                  )}
                >
                  {formatDistanceToNow(new Date(recording.createdAt), {
                    addSuffix: true,
                  })}
                </time>
              </div>
              <p
                className={cn(
                  'text-sm truncate mt-1 capitalize',
                  selectedRecordingId === recording.id
                    ? 'text-accent-foreground/90'
                    : 'text-muted-foreground'
                )}
              >
                {recording.emotion || 'No emotion'} - {recording.intensity || 'normal'}
              </p>
            </button>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
