'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Recording } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const ageRanges = [
  '18-25',
  '26-35',
  '36-45',
  '46-55',
  '56+',
];

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

const formSchema = z.object({
  speakerId: z.string().min(1, 'Speaker ID is required.'),
  transcription: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  age: z.string().optional(),
  region: z.string().optional(),
  emotion: z.string().optional(),
  intensity: z.enum(['normal', 'strong']).optional(),
  textId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MetadataFormProps {
  recording: Recording;
  onSave: (recording: Recording) => void;
}

export function MetadataForm({ recording, onSave }: MetadataFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      speakerId: recording.speakerId || '',
      transcription: recording.transcription || '',
      gender: recording.gender,
      age: recording.age,
      region: recording.region,
      emotion: recording.emotion,
      intensity: recording.intensity || 'normal',
      textId: recording.textId,
    },
  });

  function onSubmit(values: FormValues) {
    onSave({
      ...recording,
      ...values,
      transcription: values.transcription ?? '',
    });
  }

  const selectedText = texts.find(t => t.id === form.watch('textId'))?.label;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Matn (Context)</CardTitle>
            <CardDescription>
              Quyidagi matnni tanlangan emotsiyada ayting.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                        <FormLabel className="font-normal">Oddiy (Normal)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="strong" />
                        </FormControl>
                        <FormLabel className="font-normal">Kuchli (Strong)</FormLabel>
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
                    <Input placeholder="e.g. UZ_01" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Yosh oralig'ini tanlang..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ageRanges.map(age => <SelectItem key={age} value={age}>{age}</SelectItem>)}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hududni tanlang..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map(region => <SelectItem key={region} value={region.toLowerCase()}>{region}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="transcription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transkripsiya (Ixtiyoriy)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Yozib olingan matnni bu yerga kiriting..."
                      {...field}
                      rows={3}
                      className="resize-y"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={!form.formState.isDirty} size="lg">
          O'zgarishlarni saqlash
        </Button>
      </form>
    </Form>
  );
}
