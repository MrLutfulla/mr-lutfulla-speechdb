'use client';

import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Recording, PersonalityTraits } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AudioRecorder } from './audio-recorder';

const emotions = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'calm', label: 'Tinch (Calm)' },
  { id: 'happy', label: 'Quvnoq (Happy)' },
  { id: 'sad', label: 'Xafa (Sad)' },
  { id: 'angry', label: 'G‘azablangan (Angry)' },
  { id: 'fearful', label: 'Qo‘rqqan (Fearful)' },
  { id: 'disgust', label: 'Nafratlangan (Disgust)' },
  { id: 'surprised', label: 'Hayratlangan (Surprised)' },
];

const texts = [
  { id: 'text1', label: 'Bolalar eshik yonida gaplashmoqda.' },
  { id: 'text2', label: 'Itlar deraza yonida o‘tiribdi.' },
  { id: 'text3', label: 'Bugun osmon tiniq, shamol yo‘q.' },
];

const ageRanges = ['18-25', '26-35', '36-45', '46-55', '56+'];

const regions = [
  'Toshkent',
  'Andijon',
  'Buxoro',
  'Farg‘ona',
  'Jizzax',
  'Namangan',
  'Navoiy',
  'Qashqadaryo',
  'Samarqand',
  'Sirdaryo',
  'Surxondaryo',
  'Xorazm',
  'Qoraqalpog‘iston',
];

const personalityTraits: { id: keyof PersonalityTraits; label: string }[] = [
  { id: 'openness', label: 'Ochiqlik (Openness)' },
  { id: 'conscientiousness', label: 'Vijdonlilik (Conscientiousness)' },
  { id: 'extraversion', label: 'Ekstraversiya (Extraversion)' },
  { id: 'agreeableness', label: 'Yoqimlilik (Agreeableness)' },
  { id: 'neuroticism', label: 'Nevrotizm (Neuroticism)' },
];

const formSchema = z.object({
  speakerId: z.string().min(1, 'Speaker ID is required.'),
  gender: z.enum(['male', 'female'], { required_error: 'Jinsini tanlang' }),
  age: z.string({ required_error: 'Yoshni tanlang' }),
  region: z.string({ required_error: 'Hududni tanlang' }),
  emotion: z.string({ required_error: 'Emotsiyani tanlang' }),
  intensity: z.enum(['normal', 'strong']),
  textId: z.string({ required_error: 'Matnni tanlang' }),
  personality: z.object({
    openness: z.boolean().default(false),
    conscientiousness: z.boolean().default(false),
    extraversion: z.boolean().default(false),
    agreeableness: z.boolean().default(false),
    neuroticism: z.boolean().default(false),
  }),
});

export type FormValues = z.infer<typeof formSchema>;

interface MetadataFormProps {
  recording: Partial<Recording>;
  onSave: (values: any) => void;
  isNewRecording: boolean;
  onValuesChange?: (values: FormValues) => void;
  onRecord: (blob: Blob) => void;
}

export function MetadataForm({
  recording,
  onSave,
  isNewRecording,
  onValuesChange,
  onRecord,
}: MetadataFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      speakerId: recording.speakerId || '',
      gender: recording.gender,
      age: recording.age,
      region: recording.region,
      emotion: recording.emotion || 'neutral',
      intensity: recording.intensity || 'normal',
      textId: recording.textId || 'text1',
      personality: recording.personality || {
        openness: false,
        conscientiousness: false,
        extraversion: false,
        agreeableness: false,
        neuroticism: false,
      },
    },
  });
  
  const stableOnValuesChange = useCallback(onValuesChange, []);

  useEffect(() => {
    if (stableOnValuesChange) {
      const subscription = form.watch((values) => {
        const result = formSchema.safeParse(values);
        if (result.success) {
          stableOnValuesChange(result.data as FormValues);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [form, stableOnValuesChange, formSchema]);


  useEffect(() => {
    form.reset({
      speakerId: recording.speakerId || '',
      gender: recording.gender,
      age: recording.age,
      region: recording.region,
      emotion: recording.emotion || 'neutral',
      intensity: recording.intensity || 'normal',
      textId: recording.textId || 'text1',
      personality: recording.personality || {
        openness: false,
        conscientiousness: false,
        extraversion: false,
        agreeableness: false,
        neuroticism: false,
      },
    });
  }, [recording, form]);

  function onSubmit(values: FormValues) {
    onSave({
      ...recording,
      ...values,
    });
  }

  const selectedText = texts.find((t) => t.id === form.watch('textId'))?.label;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Matn va Ovoz Yozish</CardTitle>
            <CardDescription>
              Quyidagi matnni tanlangan emotsiyada o'qing va yozib oling.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="textId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matnni tanlang</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Matnni tanlang..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {texts.map((text) => (
                        <SelectItem key={text.id} value={text.id}>
                          {text.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedText && (
              <div className="p-4 border-l-4 border-primary bg-primary/10">
                <p className="font-mono text-lg">"{selectedText}"</p>
              </div>
            )}
             {isNewRecording && (
              <div className="flex flex-col items-center gap-4 pt-4">
                <AudioRecorder onSave={onRecord} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emotsiya va Intensivlik</CardTitle>
            <CardDescription>
              Yozuv uchun emotsiya va uning darajasini tanlang.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="emotion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emotsiya</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Emotsiyani tanlang..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {emotions.map((emotion) => (
                        <SelectItem key={emotion.id} value={emotion.id}>
                          {emotion.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="intensity"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Intensivlik</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="normal" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Oddiy (Normal)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="strong" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Kuchli (Strong)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ishtirokchi ma'lumotlari (Speaker Metadata)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="speakerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ishtirokchi ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. UZ_01"
                      {...field}
                      disabled={isNewRecording}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jinsi</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Jinsini tanlang..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Erkak</SelectItem>
                        <SelectItem value="female">Ayol</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yoshi</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Yosh oralig'ini tanlang..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ageRanges.map((age) => (
                          <SelectItem key={age} value={age}>
                            {age}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hudud</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hududni tanlang..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region} value={region.toLowerCase()}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Shaxsiyat xususiyatlari (Personality Traits)</CardTitle>
            <CardDescription>
              Ishtirokchiga tegishli deb hisoblagan xususiyatlarni belgilang.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {personalityTraits.map((item) => (
              <FormField
                key={item.id}
                control={form.control}
                name={`personality.${item.id}`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{item.label}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>

        {!isNewRecording && (
          <Button type="submit" disabled={!form.formState.isDirty} size="lg">
            O'zgarishlarni saqlash
          </Button>
        )}
      </form>
    </Form>
  );
}
