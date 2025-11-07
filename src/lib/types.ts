'use client';

import type { Timestamp } from 'firebase/firestore';

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
  storagePath: string;
  speakerId: string;
  createdAt: string | Timestamp;
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
  textId: string;
};

// This type is no longer needed as we are not using localStorage
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

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  recordingCount?: number;
}
