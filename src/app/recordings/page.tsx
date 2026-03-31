'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Header } from '@/components/header';
import { useFirestore, useUser } from '@/firebase';
import { Recording } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mic2 } from 'lucide-react';
import { AudioPlayer } from '@/components/audio-player';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';

function formatDate(value: Recording['createdAt']) {
  if (typeof value === 'string') {
    return new Date(value).toLocaleString();
  }

  if (value && typeof value === 'object' && 'toDate' in value) {
    return value.toDate().toLocaleString();
  }

  return 'Nomaʼlum vaqt';
}

function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function getDurationSeconds(recording: Recording) {
  const legacyDuration = Number(recording.duration || 0);
  if (Number.isFinite(legacyDuration) && legacyDuration > 0) {
    return legacyDuration;
  }

  const fileDuration = Number((recording as unknown as { file?: { durationSec?: number } }).file?.durationSec || 0);
  if (Number.isFinite(fileDuration) && fileDuration > 0) {
    return fileDuration;
  }

  return 0;
}


async function downloadOwnArchive(recordings: Recording[], displayName?: string | null) {
  if (recordings.length === 0) {
    alert("Yuklab olish uchun yozuvlar topilmadi.");
    return;
  }

  const zip = new JSZip();
  const safeName = (displayName || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
  const root = zip.folder(`${safeName}_recordings`);
  if (!root) return;

  const audioFolder = root.folder('audio');
  const jsonFolder = root.folder('json');

  const allMetadata = recordings.map((rec) => ({
    id: rec.id,
    textId: rec.textId,
    emotion: rec.emotion,
    intensity: rec.intensity,
    gender: rec.gender,
    age: rec.age,
    region: rec.region,
    personality: rec.personality,
    duration: getDurationSeconds(rec),
    createdAt: formatDate(rec.createdAt),
  }));

  root.file('metadata.json', JSON.stringify(allMetadata, null, 2));

  recordings.forEach((rec) => {
    const base = `${rec.speakerId || 'speaker'}_${rec.textId}_${rec.emotion}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const audioData = rec.audioBase64.includes(',') ? rec.audioBase64.split(',')[1] : rec.audioBase64;

    audioFolder?.file(`${base}.webm`, audioData, { base64: true });
    jsonFolder?.file(
      `${base}.json`,
      JSON.stringify(
        {
          id: rec.id,
          textId: rec.textId,
          emotion: rec.emotion,
          intensity: rec.intensity,
          gender: rec.gender,
          age: rec.age,
          region: rec.region,
          personality: rec.personality,
          duration: getDurationSeconds(rec),
          createdAt: formatDate(rec.createdAt),
        },
        null,
        2
      )
    );
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${safeName}_speech_dataset.zip`);
}

export default function RecordingsPage() {
  const { user, loading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    const fetchRecordings = async () => {
      if (!firestore || !user) return;

      try {
        setFetching(true);
        const recRef = collection(firestore, 'users', user.uid, 'recordings');
        const q = query(recRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const rows = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Recording, 'id'>),
        }));
        setRecordings(rows);
      } finally {
        setFetching(false);
      }
    };

    fetchRecordings();
  }, [firestore, user, loading, router]);

  const totalDuration = useMemo(
    () => recordings.reduce((sum, rec) => sum + getDurationSeconds(rec), 0),
    [recordings]
  );

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mening yozuvlarim</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Jami: <span className="font-semibold text-foreground">{recordings.length}</span> ta yozuv,
                umumiy davomiyligi{' '}
                <span className="font-semibold text-foreground">{formatDuration(totalDuration)}</span>.
              </p>
              <Button
                className="mt-4"
                onClick={() => downloadOwnArchive(recordings, user?.displayName)}
                disabled={recordings.length === 0}
              >
                Mening ma'lumotlarimni yuklab olish
              </Button>
            </CardContent>
          </Card>

          {recordings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Mic2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                Hozircha saqlangan yozuvlar yo'q.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recordings.map((recording) => (
                <Card key={recording.id}>
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{recording.emotion || 'emotion yo\'q'}</Badge>
                      <Badge variant="outline">{recording.intensity || 'normal'}</Badge>
                      <Badge variant="outline">{recording.gender || 'gender yo\'q'}</Badge>
                      <Badge variant="outline">{recording.region || 'hudud yo\'q'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(recording.createdAt)} • {formatDuration(getDurationSeconds(recording))}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <AudioPlayer audioUrl={recording.audioBase64} />
                    <p className="text-sm">
                      <span className="text-muted-foreground">Text ID:</span>{' '}
                      <span className="font-mono">{recording.textId}</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
