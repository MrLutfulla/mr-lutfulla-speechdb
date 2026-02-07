'use client';

import { useState, useEffect, useMemo } from 'react';
import { NewRecordingMetadata, PersonalityTraits } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { emotionInstructions, Instruction } from '@/lib/instructions';

interface MetadataFormProps {
  onMetadataChange: (metadata: Omit<NewRecordingMetadata, 'textId'>, isValid: boolean) => void;
  textId: string; 
}

// Yo'riqnomadan kalitlarni olib, emotsiyalar ro'yxatini yaratish
const emotions = Object.keys(emotionInstructions).map(key => ({
    id: key,
    label: emotionInstructions[key].title.split(' ')[1], // "NEUTRAL", "CALM" etc.
}));

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

function InstructionDisplay({ instruction }: { instruction: Instruction }) {
    return (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800">{instruction.title}</h3>
            <p className="text-sm text-blue-700 mt-1">{instruction.description}</p>
        </div>
    )
}

export function MetadataForm({ onMetadataChange, textId }: MetadataFormProps) {
  const [emotion, setEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<string>('');
  const [region, setRegion] = useState<string | null>(null);
  const [personality, setPersonality] = useState<PersonalityTraits>({} as PersonalityTraits);

  useEffect(() => {
    setEmotion(null);
    setIntensity(null);
    setGender(null);
    setAge('');
    setRegion(null);
    setPersonality({ extrovert: false, introvert: false, optimistic: false, emotional: false, calm: false, analytical: false, leader: false, compassionate: false });
  }, [textId]);

  const isFormValid = useMemo(() => {
    const ageAsNumber = Number(age);
    return (
      !!emotion &&
      !!intensity &&
      !!gender &&
      age.trim() !== '' && !isNaN(ageAsNumber) && ageAsNumber > 0 &&
      !!region &&
      Object.values(personality).some(value => value)
    );
  }, [emotion, intensity, gender, age, region, personality]);

  const metadata: Omit<NewRecordingMetadata, 'textId'> = useMemo(() => ({
    emotion,
    intensity,
    gender,
    age: age.trim(),
    region,
    personality,
  }), [emotion, intensity, gender, age, region, personality]);

  useEffect(() => {
    onMetadataChange(metadata, isFormValid);
  }, [metadata, isFormValid, onMetadataChange]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground mb-1">Label Ma'lumotlari</h2>
      <p className="text-sm text-muted-foreground mb-4">📌 Iltimos, quyidagi gapni ko‘rsatilgan emotsiyada o‘qing. Bu aktyorlik tarzida bajariladi, real holatingiz shart emas.</p>

      <div className="space-y-2">
        <Label htmlFor="emotion">Emosiya:</Label>
        <Select value={emotion || ''} onValueChange={setEmotion}>
            <SelectTrigger id="emotion"><SelectValue placeholder="Emosiyani tanlang..." /></SelectTrigger>
            <SelectContent>
                {emotions.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
            </SelectContent>
        </Select>
        {emotion && emotionInstructions[emotion] && (
            <InstructionDisplay instruction={emotionInstructions[emotion]} />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="intensity">Intensivlik:</Label>
        <Select value={intensity || ''} onValueChange={setIntensity}>
            <SelectTrigger id="intensity"><SelectValue placeholder="Intensivlikni tanlang..." /></SelectTrigger>
            <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="low">Low</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Jins:</Label>
        <Select value={gender || ''} onValueChange={setGender}>
            <SelectTrigger id="gender"><SelectValue placeholder="Jinsni tanlang..." /></SelectTrigger>
            <SelectContent>
                <SelectItem value="male">Erkak</SelectItem>
                <SelectItem value="female">Ayol</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Yosh:</Label>
        <Input 
            id="age" 
            type="number" 
            value={age} 
            onChange={(e) => setAge(e.target.value)} 
            placeholder="Yoshingizni kiriting..." 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">Hudud:</Label>
        <Select value={region || ''} onValueChange={setRegion}>
            <SelectTrigger id="region"><SelectValue placeholder="Hududni tanlang..." /></SelectTrigger>
            <SelectContent>
                {regions.map(r => <SelectItem key={r} value={r.toLowerCase().replace(/['ʻ]/g, "")}>{r}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Shaxsiyat xususiyatlari:</Label>
        <div className="grid grid-cols-2 gap-4">
          {personalityTraits.map(trait => (
            <div key={trait.id} className="flex items-center space-x-2">
              <Checkbox 
                id={trait.id} 
                checked={personality[trait.id as keyof PersonalityTraits] || false} 
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
