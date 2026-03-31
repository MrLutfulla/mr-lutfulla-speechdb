'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, StopCircle, Volume2, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [isNoiseHigh, setIsNoiseHigh] = useState(false);

  const durationRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const monitorFrameRef = useRef<number | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
    }, 1000);
  };

  const cleanupAudioMonitoring = useCallback(() => {
    if (monitorFrameRef.current !== null) {
      cancelAnimationFrame(monitorFrameRef.current);
      monitorFrameRef.current = null;
    }

    analyserRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => null);
      audioContextRef.current = null;
    }

    setMicLevel(0);
    setNoiseLevel(0);
    setIsNoiseHigh(false);
  }, []);

  const startAudioMonitoring = useCallback((stream: MediaStream) => {
    cleanupAudioMonitoring();

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const buffer = new Float32Array(analyser.fftSize);

    const tick = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getFloatTimeDomainData(buffer);

      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        sumSquares += buffer[i] * buffer[i];
      }

      const rms = Math.sqrt(sumSquares / buffer.length);
      const mic = Math.min(100, Math.round(rms * 220));
      const noise = Math.min(100, Math.max(0, Math.round((rms - 0.03) * 260)));

      setMicLevel(mic);
      setNoiseLevel(noise);
      setIsNoiseHigh(noise >= 60);

      monitorFrameRef.current = requestAnimationFrame(tick);
    };

    monitorFrameRef.current = requestAnimationFrame(tick);
  }, [cleanupAudioMonitoring]);

  const stopStreamTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        onRecordingComplete(blob, durationRef.current);
        audioChunksRef.current = [];
        stopStreamTracks();
        cleanupAudioMonitoring();
      };

      recorder.start();
      durationRef.current = 0;
      setDuration(0);
      setIsRecording(true);
      startTimer();
      startAudioMonitoring(stream);
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Mikrofon topilmadi yoki ruxsat berilmadi.');
    }
  }, [cleanupAudioMonitoring, onRecordingComplete, startAudioMonitoring, stopStreamTracks]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  }, [isRecording]);

  const handleReset = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    stopStreamTracks();
    cleanupAudioMonitoring();
    setAudioBlob(null);
    durationRef.current = 0;
    setDuration(0);
    stopTimer();

    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopStreamTracks();
      cleanupAudioMonitoring();
    };
  }, [cleanupAudioMonitoring, stopStreamTracks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-6">
      <div className="w-full rounded-lg border bg-muted/30 p-4 space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Volume2 className="h-3.5 w-3.5" /> Mikrofon darajasi</span>
            <span>{micLevel}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${micLevel}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Shovqin darajasi</span>
            <span>{noiseLevel}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className={`h-2 rounded-full transition-all ${isNoiseHigh ? 'bg-destructive' : 'bg-amber-500'}`} style={{ width: `${noiseLevel}%` }} />
          </div>
          {isRecording && isNoiseHigh && (
            <p className="mt-2 text-xs text-destructive font-medium">Shovqin baland. Iltimos, tinchroq joyda yozing.</p>
          )}
        </div>
      </div>

      <div className="text-4xl font-mono font-bold tracking-wider">{formatTime(duration)}</div>

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
