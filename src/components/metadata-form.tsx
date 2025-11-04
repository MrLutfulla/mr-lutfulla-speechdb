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
import { Checkbox } from '@/components/ui/checkbox';

const personalityTraits = [
  { id: 'extrovert', label: 'Extrovert' },
  { id: 'introvert', label: 'Introvert' },
  { id: 'logical', label: 'Logical' },
  { id: 'emotional', label: 'Emotional' },
  { id: 'creative', label: 'Creative' },
  { id: 'analytical', label: 'Analytical' },
] as const;

const formSchema = z.object({
  speakerId: z.string().min(1, 'Speaker ID is required.'),
  transcription: z.string().optional(),
  labels: z.array(z.string()).optional(),
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
      labels: recording.labels || [],
    },
  });

  function onSubmit(values: FormValues) {
    onSave({
      ...recording,
      ...values,
      transcription: values.transcription ?? '',
      labels: values.labels ?? [],
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="speakerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speaker ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Speaker 01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transcription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transcription</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the spoken text here..."
                      {...field}
                      rows={5}
                      className="resize-y"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personality Labels</CardTitle>
            <CardDescription>
              Select the traits that best describe the speaker.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="labels"
              render={() => (
                <FormItem className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {personalityTraits.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="labels"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...(field.value || []),
                                        item.id,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={!form.formState.isDirty}>
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
