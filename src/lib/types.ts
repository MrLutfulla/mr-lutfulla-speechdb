export interface Recording {
  id: string;
  audioUrl: string;
  speakerId: string;
  transcription: string;
  createdAt: string;
}

export interface StoredRecording {
  id: string;
  speakerId: string;
  transcription: string;
  createdAt: string;
  audioBase64: string;
}
