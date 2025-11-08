
'use client';

import { useEffect } from 'react';
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

const emotions = [
  { id: 'neutral', label: 'Neytral (Neutral)' },
  { id: 'calm', label: 'Tinch (Calm)' },
  { id: 'happy', label: 'Xursand (Happy)' },
  { id: 'sad', label: 'Xafa (Sad)' },
  { id: 'angry', label: 'Jahldor (Angry)' },
  { id: 'fearful', label: 'Qo‘rquv (Fearful)' },
  { id: 'disgust', label: 'Jirkanish (Disgust)' },
  { id: 'surprised', label: 'Hayrat (Surprised)' },
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

const ageRanges = ['18 yoshgacha', '18-25', '26-35', '36-45', '46-55', '56+'];

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

const personalityTraits: { id: keyof PersonalityTraits; label: string, description: string }[] = [
    { id: 'extrovert', label: 'Ekstravert', description: 'faol, ochiqko‘ngil, jamoada bo‘lishni yoqtiradi' },
    { id: 'introvert', label: 'Introvert', description: 'tinchlikni yoqtiradi, kamgap' },
    { id: 'optimistic', label: 'Ijobiy fikrlaydigan', description: 'optimistik, quvnoq' },
    { id: 'emotional', label: 'Emotsional', description: 'tez hayajonlanadigan, hissiyotli' },
    { id: 'calm', label: 'Tinch va osoyishta', description: 'xotirjam, barqaror' },
    { id: 'analytical', label: 'Analitik', description: 'mantiqan o‘ylaydigan, kuzatuvchan' },
    { id: 'leader', label: 'Yetakchi', description: 'faol, boshqalarni boshqarishni yoqtiradi' },
    { id: 'compassionate', label: 'Rahmdil', description: 'boshqalarga yordam berishni yoqtiradi' },
];

// speakerId is removed from the form schema as it's now auto-generated
const formSchema = z.object({
  gender: z.enum(['male', 'female'], { required_error: 'Jinsini tanlang' }),
  age: z.string({ required_error: 'Yoshni tanlang' }),
  region: z.string({ required_error: 'Hududni tanlang' }),
  emotion: z.string({ required_error: 'Emotsiyani tanlang' }),
  intensity: z.enum(['normal', 'strong']),
  textId: z.string({ required_error: 'Matnni tanlang' }),
  personality: z.object({
    extrovert: z.boolean().default(false),
    introvert: z.boolean().default(false),
    optimistic: z.boolean().default(false),
    emotional: z.boolean().default(false),
    calm: z.boolean().default(false),
    analytical: z.boolean().default(false),
    leader: z.boolean().default(false),
    compassionate: z.boolean().default(false),
  }),
});

export type FormValues = z.infer<typeof formSchema>;

interface MetadataFormProps {
  recording: Partial<Recording>;
  onSave: (values: any) => void;
  isNewRecording: boolean;
  isReadOnly?: boolean;
}

export function MetadataForm({
  recording,
  onSave,
  isNewRecording,
  isReadOnly = false,
}: MetadataFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    disabled: isReadOnly,
  });

  useEffect(() => {
    if (recording) {
        form.reset({
            gender: recording.gender,
            age: recording.age,
            region: recording.region,
            emotion: recording.emotion || 'neutral',
            intensity: recording.intensity || 'normal',
            textId: recording.textId || 'sentence_1',
            personality: recording.personality || {
                extrovert: false, introvert: false, optimistic: false, emotional: false,
                calm: false, analytical: false, leader: false, compassionate: false,
            },
        });
    }
  }, [recording, form.reset]);


  function onSubmit(values: FormValues) {
    onSave({
      ...recording,
      ...values,
    });
    form.reset(values); // Keep form values after saving
  }

  const selectedText = texts.find((t) => t.id === form.watch('textId'))?.label;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Matn (Context)</CardTitle>
          </CardHeader>
          <CardContent>
             <FormField
              control={form.control}
              name="textId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!isNewRecording || isReadOnly}
                    >
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedText && (
              <div className="mt-4 p-4 border-l-4 border-primary bg-primary/10">
                <p className="font-mono text-lg">"{selectedText}"</p>
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
                    value={field.value}
                    disabled={isReadOnly}
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
                      value={field.value}
                      className="flex items-center space-x-4"
                      disabled={isReadOnly}
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
            <CardDescription>
              Bu ma'lumotlar avtomatik to'ldirilmaydi, o'zingiz kiriting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* speakerId field is removed */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jinsi</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isReadOnly}
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
                      value={field.value}
                      disabled={isReadOnly}
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
                      value={field.value}
                      disabled={isReadOnly}
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
              Iltimos, o‘zingizga eng yaqin deb hisoblagan xususiyatlarni belgilang.
            </CardDescription>
          </Header>
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
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{item.label}</FormLabel>
                      <FormDescription>{item.description}</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>

        {!isReadOnly && (
            <Button type="submit" disabled={!form.formState.isDirty} size="lg">
              O'zgarishlarni saqlash
            </Button>
        )}
      </form>
    </Form>
  );
}
