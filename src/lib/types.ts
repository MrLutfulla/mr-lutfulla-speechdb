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
  audioBase64: string; // Changed from audioUrl and storagePath
  speakerId: string;
  createdAt: string | Timestamp;
  emotion: string;
  intensity: 'normal' | 'strong';
  textId: string;
  gender: 'male' | 'female';
  age: string;
  region: string;
  personality: PersonalityTraits;
  duration: number; // in seconds
}

export type NewRecordingMetadata = {
  emotion: string | null;
  intensity: string | null;
  gender: string | null;
  age: string | null;
  region: string | null;
  personality: PersonalityTraits;
  textId: string;
};

// This type is no longer needed
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
  duration: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  recordingCount?: number;
  totalDuration?: number;
}
