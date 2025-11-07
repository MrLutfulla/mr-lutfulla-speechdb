'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Save, AlertCircle, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AudioRecorderProps {
  onSave: (blob: Blob) => void;
}

type RecordingStatus = 'idle' | 'permission' | 'recording' | 'stopped' | 'error';

export function AudioRecorder({ onSave }: AudioRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);
  
  const startTimer = useCallback(() => {
    stopTimer(); 
    setTimer(0);
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);


  useEffect(() => {
    return () => {
      stopStream();
      stopTimer();
    };
  }, [stopStream, stopTimer]);

  const startRecording = async () => {
    setStatus('permission');
    setError(null);
    setAudioBlob(null);
    chunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('error');
      setError("Bu brauzerda ovoz yozish qo'llab-quvvatlanmaydi. Iltimos, Chrome yoki Safari kabi standart brauzerdan foydalaning.");
      return;
    }

    let mediaStream: MediaStream;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
        }
      });
      setStream(mediaStream);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setStatus('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Mikrofonga ruxsat berilmadi. Iltimos, brauzer sozlamalaridan ruxsat bering.");
      } else {
        setError("Mikrofonga kirish imkoni yo‘q. Agar siz Telegram kabi ilova ichidagi brauzerdan foydalanayotgan bo'lsangiz, iltimos, sahifani oddiy brauzerda (masalan, Chrome yoki Safari) oching.");
      }
      return;
    }
    
    setStatus('recording');
    startTimer();

    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000,
    };
    
    const recorder = new MediaRecorder(mediaStream, options);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      let blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      setStatus('stopped');
      stopTimer();
      stopStream();
    };

    recorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSave = () => {
    if (audioBlob) {
      onSave(audioBlob);
      reset();
    }
  };

  const reset = () => {
    setStatus('idle');
    setAudioBlob(null);
    setError(null);
    setTimer(0);
    stopTimer();
    stopStream();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardContent className="flex flex-col items-center gap-4 p-6">
        {status === 'error' && error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Mikrofonga kirishda xatolik</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-center gap-4 h-14">
          {status === 'idle' && (
            <Button onClick={startRecording} size="lg" className="w-48">
              <Mic className="mr-2 h-5 w-5" />
              Yozib olish
            </Button>
          )}
          {status === 'permission' && <p>Ruxsat so'ralmoqda...</p>}
          {status === 'recording' && (
            <Button onClick={stopRecording} size="lg" variant="destructive" className="w-48">
              <StopCircle className="mr-2 h-5 w-5" />
              To'xtatish
            </Button>
          )}
          {status === 'stopped' && (
            <div className="flex gap-2">
              <Button onClick={handleSave} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Save className="mr-2 h-5 w-5" />
                Saqlash
              </Button>
              <Button onClick={reset} size="lg" variant="outline">
                <RefreshCcw className="mr-2 h-5 w-5" />
                Bekor qilish
              </Button>
            </div>
          )}
        </div>
        <div className="text-3xl font-mono tabular-nums h-9 text-muted-foreground">
          {(status === 'recording' || status === 'stopped') && formatTime(timer)}
        </div>
      </CardContent>
    </Card>
  );
}
