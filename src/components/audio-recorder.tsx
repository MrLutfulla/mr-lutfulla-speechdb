'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Pause, Play, Trash2, StopCircle } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        onRecordingComplete(blob, duration);
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      startTimer();
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Mikrofon topilmadi yoki ruxsat berilmadi.');
    }
  }, [onRecordingComplete, duration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  }, [isRecording]);

  const handleReset = () => {
    stopRecording();
    setAudioBlob(null);
    setDuration(0);
    stopTimer();
    if(audioRef.current) {
        audioRef.current.src = '';
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-6">
        <div className="w-full h-24 bg-muted/50 rounded-lg flex items-center justify-center">
            {/* Placeholder for waveform visualizer */}
            <div className="text-muted-foreground">Ovoz to'lqini</div>
        </div>

        <div className="text-4xl font-mono font-bold tracking-wider">
            {formatTime(duration)}
        </div>

        <div className="flex items-center justify-center gap-4">
            {audioBlob && (
                <Button onClick={handleReset} variant="outline" size="lg">
                   Qayta Yozish
                </Button>
            )}
            
            {!isRecording && !audioBlob && (
                <button 
                    onClick={startRecording} 
                    className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transition-transform transform hover:scale-105 ring-4 ring-primary/20"
                >
                    <Mic className="h-10 w-10" />
                </button>
            )}

            {isRecording && (
                 <Button onClick={stopRecording} variant="destructive" size="lg" className="rounded-full w-24 h-24">
                    <StopCircle className="h-10 w-10" />
                </Button>
            )}
        </div>
        
        {audioBlob && (
            <div className="w-full">
                <audio ref={audioRef} src={URL.createObjectURL(audioBlob)} controls className="w-full" />
            </div>
        )}
    </div>
  );
}
