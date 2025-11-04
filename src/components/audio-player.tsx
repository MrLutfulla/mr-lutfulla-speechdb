'use client';

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  return (
    <div>
      <audio controls src={audioUrl} className="w-full rounded-lg">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
