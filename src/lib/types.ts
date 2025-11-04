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
  transcription?: string; // Optional field from before
  labels?: string[]; // Optional field from before
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
  transcription?: string;
  labels?: string[];
}
