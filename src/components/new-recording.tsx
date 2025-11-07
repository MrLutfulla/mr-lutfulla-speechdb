'use client';

import { useState } from 'react';
import { AudioRecorder } from './audio-recorder';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { NewRecordingMetadata } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

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
  onBack: () => void;
}

export function NewRecording({ onSaveRecording, onBack }: NewRecordingProps) {
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');

  const handleRecord = (blob: Blob) => {
    onSaveRecording(blob, { emotion: selectedEmotion });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-0 md:p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-4 md:hidden mb-4">
           <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Go back to list</span>
            </Button>
            <h2 className='text-2xl font-headline font-bold'>New Recording</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gap matni</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg md:text-xl font-mono p-4 border-l-4 border-primary bg-primary/10 rounded-r-md">
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
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4"
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
                      'flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-sm md:text-base hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors',
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
           <h2 className="text-md md:text-lg font-semibold">🔈 Tayyor bo‘lsangiz, yozishni boshlang.</h2>
           <AudioRecorder onSave={handleRecord} />
        </div>
      </div>
    </div>
  );
}
