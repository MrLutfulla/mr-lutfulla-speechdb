'use client';

import { Recording } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Mic2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface RecordingListProps {
  recordings: Recording[];
  selectedRecordingId: string | null;
  onSelectRecording: (id: string) => void;
  loading: boolean;
}

export function RecordingList({
  recordings,
  selectedRecordingId,
  onSelectRecording,
  loading,
}: RecordingListProps) {
  if (loading) {
    return (
      <div className="p-2 space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      {recordings.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground flex flex-col items-center justify-center h-full">
          <Mic2 className="w-16 h-16 mb-4 text-muted-foreground/50" />
          <p className="font-semibold">Hali yozuvlar yo'q</p>
          <p className="text-sm">Yangi yozuv yarating.</p>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {recordings.map((recording) => (
            <button
              key={recording.id}
              onClick={() => onSelectRecording(recording.id)}
              className={cn(
                'w-full text-left p-3 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'hover:bg-accent/50',
                selectedRecordingId === recording.id
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-transparent'
              )}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium truncate">{recording.speakerId || 'ID raqamsiz'}</p>
                <time
                  className={cn(
                    'text-xs shrink-0 ml-4',
                    selectedRecordingId === recording.id
                      ? 'text-accent-foreground/80'
                      : 'text-muted-foreground'
                  )}
                >
                  {formatDistanceToNow(new Date(recording.createdAt as string), {
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
                {recording.emotion || 'Emotsiyasiz'} - {recording.intensity || 'normal'}
              </p>
            </button>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}

    