'use client';

export interface PersonalityTraits {
  extrovert: boolean;
  introvert: boolean;
  optimistic: boolean;
  emotional: boolean;
  calm: boolean;
  analytical: boolean;
  leader: boolean;
  compassionate: boolean;
}

export interface Recording {
  id: string;
  audioUrl: string;
  speakerId: string;
  createdAt: string;
  emotion: string;
  intensity: 'normal' | 'strong';
  textId: string;
  gender: 'male' | 'female';
  age: string;
  region: string;
  personality: PersonalityTraits;
}

export type NewRecordingMetadata = {
  emotion: string;
};

export interface StoredRecording {
  id: string;
  speakerId: string;
  createdAt: string;
  audioBase64: string;
  emotion: string;
  intensity: 'normal' | 'strong';
  textId: string;
  gender: 'male' | 'female';
  age: string;
  region: string;
  personality: PersonalityTraits;
}
