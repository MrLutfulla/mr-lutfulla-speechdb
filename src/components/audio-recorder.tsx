'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Save, AlertCircle, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onSave: (blob: Blob) => void;
}

type RecordingStatus = 'idle' | 'permission' | 'recording' | 'stopped' | 'error';

export function AudioRecorder({ onSave }: AudioRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [timer, setTimer] = useState(0);
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

  useEffect(() => {
    return () => {
      stopStream();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [stopStream]);

  const startRecording = async () => {
    setStatus('permission');
    setTimer(0);

    let mediaStream: MediaStream;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setStatus('error');
      toast({
        title: 'Microphone Error',
        description: 'Could not access your microphone. Please check your browser permissions.',
        variant: 'destructive',
      });
      return;
    }
    
    setStatus('recording');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    mediaRecorderRef.current = new MediaRecorder(mediaStream);
    chunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
      setAudioBlob(blob);
      setStatus('stopped');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopStream();
    };

    mediaRecorderRef.current.start();
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
    setTimer(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      {status === 'error' && (
        <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-md">
          <AlertCircle className="h-5 w-5" />
          <p>Microphone access denied.</p>
        </div>
      )}
      <div className="flex items-center justify-center gap-4 h-14">
        {status === 'idle' && (
          <Button onClick={startRecording} size="lg" className="w-48">
            <Mic className="mr-2 h-5 w-5" />
            Record
          </Button>
        )}
        {status === 'permission' && <p>Requesting permission...</p>}
        {status === 'recording' && (
          <Button onClick={stopRecording} size="lg" variant="destructive" className="w-48">
            <StopCircle className="mr-2 h-5 w-5" />
            Stop
          </Button>
        )}
        {status === 'stopped' && (
          <div className="flex gap-2">
            <Button onClick={handleSave} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Save className="mr-2 h-5 w-5" />
              Save
            </Button>
            <Button onClick={reset} size="lg" variant="outline">
              <RefreshCcw className="mr-2 h-5 w-5" />
              Discard
            </Button>
          </div>
        )}
      </div>
      <div className="text-3xl font-mono tabular-nums h-9">
        {(status === 'recording' || status === 'stopped') && formatTime(timer)}
      </div>
    </div>
  );
}
