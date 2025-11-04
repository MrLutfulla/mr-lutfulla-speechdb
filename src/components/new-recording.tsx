'use client';

import { useState, useCallback, useMemo } from 'react';
import { MetadataForm, FormValues } from './metadata-form';
import { AudioRecorder } from './audio-recorder';
import { Recording } from '@/lib/types';

interface NewRecordingProps {
  onSaveRecording: (blob: Blob, metadata: Omit<Recording, 'id' | 'audioUrl' | 'createdAt'>) => void;
  recordings: Recording[];
}

export function NewRecording({ onSaveRecording, recordings }: NewRecordingProps) {
  const [metadata, setMetadata] = useState<FormValues | null>(null);

  const nextSpeakerIndex = useMemo(() => {
    const speakerIds = recordings.map(r => parseInt(r.speakerId.replace('UZ_', ''), 10) || 0);
    return speakerIds.length > 0 ? Math.max(...speakerIds) + 1 : 1;
  }, [recordings]);

  const initialRecordingState = useMemo(() => ({
    speakerId: `UZ_${nextSpeakerIndex.toString().padStart(2, '0')}`,
    textId: 'text1',
    emotion: 'neutral',
    intensity: 'normal' as 'normal' | 'strong',
    gender: 'male' as 'male' | 'female',
    age: '18-25',
    region: 'toshkent',
  }), [nextSpeakerIndex]);

  const handleValuesChange = useCallback((values: FormValues) => {
    setMetadata(values);
  }, []);

  const handleSave = (blob: Blob) => {
    const dataToSave = metadata || initialRecordingState;
    onSaveRecording(blob, dataToSave);
  };
  
  const formState = metadata || initialRecordingState;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 rounded-lg">
      <div className="w-full max-w-2xl space-y-6">
        <MetadataForm
          key={formState.speakerId}
          recording={formState}
          onSave={() => {}}
          isNewRecording={true}
          onValuesChange={handleValuesChange}
        >
          <div className="flex flex-col items-center gap-4 p-6">
             <AudioRecorder onSave={handleSave} />
          </div>
        </MetadataForm>
      </div>
    </div>
  );
}
