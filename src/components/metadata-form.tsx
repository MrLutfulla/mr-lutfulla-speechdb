'use client';

import { useState, useEffect, useMemo } from 'react';
import { NewRecordingMetadata } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface MetadataFormProps {
  onMetadataChange: (metadata: NewRecordingMetadata) => void;
}

const emotions = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'angry', label: 'Angry' },
  { id: 'fearful', label: 'Fearful' },
  { id: 'disgust', label: 'Disgust' },
  { id: 'surprised', label: 'Surprised' },
];

const ageRanges = ['18-25', '26-35', '36-45', '46-60', '60+'];
const regions = ['Toshkent', 'Fargʻona', 'Andijon', 'Namangan', 'Sirdaryo', 'Jizzax', 'Samarqand', 'Buxoro', 'Navoiy', 'Qashqadaryo', 'Surxondaryo', 'Xorazm', 'Qoraqalpog\'iston'];
const personalityTraits = [
    { id: 'extrovert', label: 'Extrovert' },
    { id: 'introvert', label: 'Introvert' },
    { id: 'optimistic', label: 'Optimistic' },
    { id: 'emotional', label: 'Emotional' },
    { id: 'calm', label: 'Calm' },
    { id: 'analytical', label: 'Analytical' },
    { id: 'leader', label: 'Leader' },
    { id: 'compassionate', label: 'Compassionate' },
];

export function MetadataForm({ onMetadataChange }: MetadataFormProps) {
  const [emotion, setEmotion] = useState('neutral');
  const [intensity, setIntensity] = useState('normal');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('18-25');
  const [region, setRegion] = useState('Toshkent');
  const [personality, setPersonality] = useState<Record<string, boolean>>({
    extrovert: false,
    introvert: false,
    optimistic: false,
    emotional: false,
    calm: false,
    analytical: false,
    leader: false,
    compassionate: false,
  });

  const metadata: NewRecordingMetadata = useMemo(() => ({
    textId: 'sentence_1', // This should be dynamic later
    emotion,
    intensity,
    gender,
    age,
    region,
    personality,
  }), [emotion, intensity, gender, age, region, personality]);

  useEffect(() => {
    if (typeof onMetadataChange === 'function') {
      onMetadataChange(metadata);
    }
  }, [metadata, onMetadataChange]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground mb-4 bg-primary/10 p-3 rounded-md text-primary">Label Ma'lumotlari</h2>
      
      <div className="space-y-2">
        <Label htmlFor="emotion">Feelings: Emosiya:</Label>
        <Select value={emotion} onValueChange={setEmotion}>
            <SelectTrigger id="emotion">
                <SelectValue placeholder="Emosiyani tanlang..." />
            </SelectTrigger>
            <SelectContent>
                {emotions.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intensity">Intensity: Qanday:</Label>
        <Select value={intensity} onValueChange={setIntensity}>
            <SelectTrigger id="intensity">
                <SelectValue placeholder="Intensivlikni tanlang..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="low">Low</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender: Jins:</Label>
        <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender">
                <SelectValue placeholder="Jinsni tanlang..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Age: Yosh:</Label>
        <Select value={age} onValueChange={setAge}>
            <SelectTrigger id="age">
                <SelectValue placeholder="Yoshni tanlang..." />
            </SelectTrigger>
            <SelectContent>
                {ageRanges.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">Region: Hudud:</Label>
        <Select value={region} onValueChange={setRegion}>
            <SelectTrigger id="region">
                <SelectValue placeholder="Hududni tanlang..." />
            </SelectTrigger>
            <SelectContent>
                {regions.map(r => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Personality Xususiyattiar:</Label>
        <div className="grid grid-cols-2 gap-4">
          {personalityTraits.map(trait => (
            <div key={trait.id} className="flex items-center space-x-2">
              <Checkbox 
                id={trait.id} 
                checked={personality[trait.id] || false} 
                onCheckedChange={(checked) => {
                    setPersonality(prev => ({...prev, [trait.id]: !!checked}))
                }}/>
              <Label htmlFor={trait.id} className="font-normal text-sm">{trait.label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
