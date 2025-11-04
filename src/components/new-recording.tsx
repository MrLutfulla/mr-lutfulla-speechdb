'use client';

import { useState, useCallback } from 'react';
import { MetadataForm, FormValues } from './metadata-form';
import { AudioRecorder } from './audio-recorder';
import { Recording } from '@/lib/types';

interface NewRecordingProps {
  onSaveRecording: (blob: Blob, metadata: Omit<Recording, 'id' | 'audioUrl' | 'createdAt'>) => void;
  recordingsCount: number;
}

export function NewRecording({ onSaveRecording, recordingsCount }: NewRecordingProps) {
  const [metadata, setMetadata] = useState<FormValues | null>(null);

  const initialRecordingState = {
    speakerId: `UZ_${(recordingsCount + 1).toString().padStart(2, '0')}`,
    textId: 'text1',
    emotion: 'neutral',
    intensity: 'normal' as 'normal' | 'strong',
  };

  const handleValuesChange = useCallback((values: FormValues) => {
    setMetadata(values);
  }, []);

  const handleSave = (blob: Blob) => {
    if (metadata) {
      onSaveRecording(blob, metadata);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 rounded-lg">
      <div className="w-full max-w-2xl space-y-6">
        <MetadataForm
          recording={initialRecordingState}
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
