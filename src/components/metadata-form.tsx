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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  speakerId: z.string().min(1, 'Speaker ID is required.'),
  transcription: z.string().optional(),
});

interface MetadataFormProps {
  recording: Recording;
  onSave: (recording: Recording) => void;
}

export function MetadataForm({ recording, onSave }: MetadataFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      speakerId: recording.speakerId || '',
      transcription: recording.transcription || '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave({
      ...recording,
      ...values,
      transcription: values.transcription ?? '',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <Button type="submit" disabled={!form.formState.isDirty}>
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
