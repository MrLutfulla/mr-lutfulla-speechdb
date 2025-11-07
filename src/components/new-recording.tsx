'use client';

import { useState } from 'react';
import { AudioRecorder } from './audio-recorder';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { NewRecordingMetadata } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const emotions = [
  { id: 'neutral', label: 'Neytral' },
  { id: 'calm', label: 'Tinch' },
  { id: 'happy', label: 'Xursand' },
  { id: 'sad', label: 'Xafa' },
  { id: 'angry', label: 'Jahldor' },
  { id: 'fearful', label: 'Qo‘rquv' },
  { id: 'disgust', label: 'Jirkanish' },
  { id: 'surprised', label: 'Hayrat' },
];

const texts = [
    { id: 'sentence_1', label: 'Men bu narsani kutmagan edim, lekin baribir hammasi yaxshi bo‘ldi.' },
    { id: 'sentence_2', label: 'Kecha bo‘lgan voqeani hali ham esdan chiqara olmayapman.' },
    { id: 'sentence_3', label: 'Bu natijani ko‘rganimda o‘zimga ishonmadim.' },
    { id: 'sentence_4', label: 'Bu odamning gaplari meni chuqur o‘ylantirib qo‘ydi.' },
    { id: 'sentence_5', label: 'Shunaqa holatni hayotimda birinchi marta ko‘ryapman.' },
    { id: 'sentence_6', label: 'U meni oldindan ogohlantirganda, hammasi boshqacha bo‘lardi.' },
    { id: 'sentence_7', label: 'Men bu ishni uddalayman deb o‘ylamagan edim, lekin harakat qildim.' },
    { id: 'sentence_8', label: 'Bir qarashda oddiy tuyulgan narsa aslida juda muhim ekan.' },
    { id: 'sentence_9', label: 'Bunday natijani hech kim kutmagandi, lekin u yuz berdi.' },
    { id: 'sentence_10', label: 'Ba’zan kichik bir so‘z ham odamning kayfiyatini o‘zgartiradi.' },
];

interface NewRecordingProps {
  onSaveRecording: (blob: Blob, metadata: NewRecordingMetadata) => void;
  onBack: () => void;
}

export function NewRecording({ onSaveRecording, onBack }: NewRecordingProps) {
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [selectedTextId, setSelectedTextId] = useState('sentence_1');

  const handleRecord = (blob: Blob) => {
    onSaveRecording(blob, { emotion: selectedEmotion, textId: selectedTextId });
  };

  const selectedText = texts.find(t => t.id === selectedTextId)?.label;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-0 md:p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-4 md:hidden mb-4">
           <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Ro'yxatga qaytish</span>
            </Button>
            <h2 className='text-2xl font-headline font-bold'>Yangi Yozuv</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>✅ Gap matni</CardTitle>
            <CardDescription>O‘qish uchun matnni tanlang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={setSelectedTextId} defaultValue={selectedTextId}>
              <SelectTrigger>
                <SelectValue placeholder="Matnni tanlang..." />
              </SelectTrigger>
              <SelectContent>
                {texts.map((text) => (
                  <SelectItem key={text.id} value={text.id}>
                    {text.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedText && (
              <p className="text-lg md:text-xl font-mono p-4 border-l-4 border-primary bg-primary/10 rounded-r-md text-left">
                "{selectedText}"
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎭 Emotsiya tanlang</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedEmotion}
              onValueChange={setSelectedEmotion}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4"
            >
              {emotions.map((emotion) => (
                <div key={emotion.id}>
                  <RadioGroupItem
                    value={emotion.id}
                    id={emotion.id}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={emotion.id}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-sm md:text-base hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors',
                      selectedEmotion === emotion.id && 'border-primary'
                    )}
                  >
                    {emotion.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className='flex flex-col items-center gap-4'>
           <h2 className="text-md md:text-lg font-semibold">🔈 Tayyor bo‘lsangiz, yozishni boshlang.</h2>
           <AudioRecorder onSave={handleRecord} />
        </div>
      </div>
    </div>
  );
}
