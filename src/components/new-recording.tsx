'use client';

import { useState } from 'react';
import { AudioRecorder } from './audio-recorder';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { NewRecordingMetadata } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const emotions = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'calm', label: 'Calm' },
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'angry', label: 'Angry' },
  { id: 'fearful', label: 'Fearful' },
  { id: 'disgust', label: 'Disgust' },
  { id: 'surprised', label: 'Surprised' },
];

const textToRead = "Men bu narsani kutmagan edim, lekin baribir hammasi yaxshi bo‘ldi.";

interface NewRecordingProps {
  onSaveRecording: (blob: Blob, metadata: NewRecordingMetadata) => void;
}

export function NewRecording({ onSaveRecording }: NewRecordingProps) {
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');

  const handleRecord = (blob: Blob) => {
    onSaveRecording(blob, { emotion: selectedEmotion });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8">
      <div className="w-full max-w-2xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Gap matni</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl font-mono p-4 border-l-4 border-primary bg-primary/10 rounded-r-md">
              "{textToRead}"
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎭 Emotsiya tanlang</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedEmotion}
              onValueChange={setSelectedEmotion}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {emotions.map((emotion) => (
                <div key={emotion.id}>
                  <RadioGroupItem
                    value={emotion.id}
                    id={emotion.id}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={emotion.id}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                      selectedEmotion === emotion.id && 'border-primary'
                    )}
                  >
                    {emotion.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className='flex flex-col items-center gap-4'>
           <h2 className="text-lg font-semibold">🔈 Tayyor bo‘lsangiz, yozishni boshlang.</h2>
           <AudioRecorder onSave={handleRecord} />
        </div>
      </div>
    </div>
  );
}
