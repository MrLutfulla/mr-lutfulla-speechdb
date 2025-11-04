export interface Recording {
  id: string;
  audioUrl: string;
  speakerId: string;
  transcription: string;
  createdAt: string;
  labels?: string[];
  emotion?: string;
  intensity?: 'normal' | 'strong';
  textId?: string;
  gender?: 'male' | 'female';
  age?: string;
  region?: string;
}

export interface StoredRecording {
  id: string;
  speakerId: string;
  transcription: string;
  createdAt: string;
  audioBase64: string;
  labels?: string[];
  emotion?: string;
  intensity?: 'normal' | 'strong';
  textId?: string;
  gender?: 'male' | 'female';
  age?: string;
  region?: string;
}
