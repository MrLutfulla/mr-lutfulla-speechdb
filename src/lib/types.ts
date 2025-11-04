'use client';

export interface PersonalityTraits {
  openness: boolean;
  conscientiousness: boolean;
  extraversion: boolean;
  agreeableness: boolean;
  neuroticism: boolean;
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
  personality?: PersonalityTraits;
}

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
  personality?: PersonalityTraits;
}
