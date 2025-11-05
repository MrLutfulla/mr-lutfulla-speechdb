'use client';

import { useState, useCallback, useMemo } from 'react';
import { MetadataForm, FormValues } from './metadata-form';
import { Recording } from '@/lib/types';
import { AudioRecorder } from './audio-recorder';


interface NewRecordingProps {
  onSaveRecording: (
    blob: Blob,
    metadata: Omit<Recording, 'id' | 'audioUrl' | 'createdAt'>
  ) => void;
  recordings: Recording[];
}

export function NewRecording({
  onSaveRecording,
  recordings,
}: NewRecordingProps) {
  const [metadata, setMetadata] = useState<FormValues | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const nextSpeakerIndex = useMemo(() => {
    if (recordings.length === 0) return 1;
    const speakerIds = recordings
      .map((r) => {
        const match = r.speakerId.match(/^UZ_(\d+)/);
        return match ? parseInt(match[1], 10) : NaN;
      })
      .filter((num) => !isNaN(num));
    return speakerIds.length > 0 ? Math.max(...speakerIds) + 1 : 1;
  }, [recordings]);

  const initialRecordingState: Omit<
    Recording,
    'id' | 'audioUrl' | 'createdAt'
  > = useMemo(
    () => ({
      speakerId: `UZ_${nextSpeakerIndex.toString().padStart(2, '0')}`,
      textId: 'text1',
      emotion: 'neutral',
      intensity: 'normal' as 'normal' | 'strong',
      gender: 'male' as 'male' | 'female',
      age: '18-25',
      region: 'toshkent',
      personality: {
        openness: false,
        conscientiousness: false,
        extraversion: false,
        agreeableness: false,
        neuroticism: false,
      },
    }),
    [nextSpeakerIndex]
  );

  const handleValuesChange = useCallback((values: FormValues) => {
    setMetadata(values);
  }, []);

  const handleRecord = (blob: Blob) => {
    const dataToSave = metadata || initialRecordingState;
    onSaveRecording(blob, dataToSave as Omit<Recording, 'id' | 'audioUrl' | 'createdAt'>);
  };
  
  const formState = metadata || initialRecordingState;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 rounded-lg">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-col items-center gap-4 pb-8">
            <AudioRecorder onSave={handleRecord} />
        </div>
        <MetadataForm
          key={formState.speakerId}
          recording={formState}
          onSave={() => {}}
          isNewRecording={true}
          onValuesChange={handleValuesChange}
          onRecord={() => {}}
        />
      </div>
    </div>
  );
}
