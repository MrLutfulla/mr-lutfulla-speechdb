'use client';

interface AudioPlayerProps {
  audioUrl: string; // Now this will be a base64 data URL
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
