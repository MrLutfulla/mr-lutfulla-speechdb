'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { UserProfile, NewRecordingMetadata } from '@/lib/types';
import { Header } from '@/components/header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, Archive, Edit } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { sentences, emotions, intensities, regions } from '@/lib/sentences';

interface Recording extends NewRecordingMetadata {
  id: string;
  audioBase64: string;
  createdAt: { seconds: number; nanoseconds: number; };
  duration: number;
  speakerId: string;
}

interface EnrichedUserProfile extends UserProfile {
  recordings: Recording[];
}

// Create a lookup map for sentences for efficient access
const sentenceMap = new Map(sentences.map(s => [s.id, s.text]));

function formatDuration(seconds: number = 0) {
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    const totalSeconds = Math.round(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remaining = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${remaining}s`;
    return `${minutes}m ${remaining}s`;
}

const downloadAudio = (audioBase64: string, filename: string) => {
  saveAs(audioBase64, `${filename}.webm`);
};

const downloadUserArchive = async (user: EnrichedUserProfile) => {
  if (!user.recordings || user.recordings.length === 0) {
    alert("Bu foydalanuvchida yuklab olish uchun yozuvlar yo'q.");
    return;
  }

  const zip = new JSZip();
  const userFolderName = user.displayName?.replace(/\s+/g, '_') || user.uid;
  const userFolder = zip.folder(userFolderName);
  if (!userFolder) return;

  const audioFolder = userFolder.folder('audio');
  const jsonFolder = userFolder.folder('json');

  const allMetadata = user.recordings.map(({ audioBase64, ...rest }) => ({
      ...rest,
      text: sentenceMap.get(rest.textId) || 'MATN TOPILMADI',
  }));
  userFolder.file('metadata.json', JSON.stringify(allMetadata, null, 2));

  user.recordings.forEach(rec => {
    const baseFilename = `${rec.speakerId}_${rec.emotion}_${rec.textId}`;
    const { audioBase64, ...rest } = rec;
    const singleMetadata = { ...rest, text: sentenceMap.get(rec.textId) || 'MATN TOPILMADI' };
    jsonFolder?.file(`${baseFilename}.json`, JSON.stringify(singleMetadata, null, 2));
    const audioData = audioBase64.split(',')[1];
    audioFolder?.file(`${baseFilename}.webm`, audioData, { base64: true });
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${userFolderName}_recordings.zip`);
};

export default function AdminPage() {
  const firestore = useFirestore();
  const [users, setUsers] = useState<EnrichedUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!firestore) return;
    try {
      setLoading(true);
      const usersCollection = collection(firestore, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const usersList = userSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));

      const enrichedUsers = await Promise.all(usersList.map(async (user) => {
        const recordingsRef = collection(firestore, 'users', user.uid, 'recordings');
        const recordingsSnapshot = await getDocs(recordingsRef);
        const recordings = recordingsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recording));
        return { ...user, recordings };
      }));

      setUsers(enrichedUsers);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Ma'lumotlarni yuklashda xatolik yuz berdi. Iltimos, konsolni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [firestore]);

  const handleEditClick = (recording: Recording, userId: string) => {
    setEditingRecording(JSON.parse(JSON.stringify(recording))); // Deep copy
    setCurrentUserId(userId);
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingRecording || !currentUserId || !firestore) return;

    try {
      const { id, audioBase64, createdAt, speakerId, duration, ...dataToUpdate } = editingRecording;
      const recRef = doc(firestore, 'users', currentUserId, 'recordings', id);
      await updateDoc(recRef, dataToUpdate);
      
      // Update local state to reflect changes instantly
      setUsers(prevUsers => prevUsers.map(user => 
        user.uid === currentUserId 
          ? { ...user, recordings: user.recordings.map(r => r.id === id ? editingRecording : r) }
          : user
      ));

      setIsEditDialogOpen(false);
      setEditingRecording(null);
    } catch (error) {
      console.error("Error updating recording:", error);
      alert("Yozuvni yangilashda xatolik yuz berdi.");
    }
  };

  const totalRecordings = users.reduce((sum, user) => sum + (user.recordingCount || 0), 0);
  const totalDuration = users.reduce((sum, user) => sum + (user.totalDuration || 0), 0);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Paneli</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card><CardHeader><CardTitle>Umumiy Yozuvlar</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">{totalRecordings}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Umumiy Vaqt</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">{formatDuration(totalDuration)}</p></CardContent></Card>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {users.map((user) => (
            <AccordionItem value={user.uid} key={user.uid}>
              <div className="flex items-center w-full border-b">
                <AccordionTrigger className="flex-1 text-left p-4">
                  <div className="flex flex-col items-start md:flex-row md:items-center">
                    <span className='font-bold'>{user.displayName || "Nomalum"} ({user.email})</span>
                    <span className="text-sm text-muted-foreground md:ml-4">{user.recordingCount || 0} yozuv / {formatDuration(user.totalDuration || 0)}</span>
                  </div>
                </AccordionTrigger>
                <div className="px-4"><Button variant="outline" size="sm" onClick={() => downloadUserArchive(user)} disabled={!user.recordings || user.recordings.length === 0} className='flex-shrink-0'><Archive className="h-4 w-4 mr-2" />Barchasini yuklash</Button></div>
              </div>
              <AccordionContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Emotion</TableHead><TableHead>Text ID</TableHead><TableHead>Gender</TableHead><TableHead>Duration (s)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {user.recordings?.length > 0 ? user.recordings.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>{rec.emotion}</TableCell>
                        <TableCell className="font-mono text-xs">{rec.textId}</TableCell>
                        <TableCell>{rec.gender}</TableCell>
                        <TableCell>{formatDuration(rec.duration)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(rec, user.uid)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => downloadAudio(rec.audioBase64, `${rec.speakerId}_${rec.id}`)}><Download className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    )) : <TableRow><TableCell colSpan={5} className="text-center">Yozuvlar topilmadi.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      {editingRecording && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Yozuvni Tahrirlash</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="emotion" className="text-right">Emotion</Label>
                <Select value={editingRecording.emotion} onValueChange={(value) => setEditingRecording(prev => prev ? {...prev, emotion: value} : null)}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Emotsiyani tanlang" /></SelectTrigger>
                  <SelectContent>{emotions.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="intensity" className="text-right">Intensity</Label>
                <Select value={editingRecording.intensity} onValueChange={(value) => setEditingRecording(prev => prev ? {...prev, intensity: value} : null)}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Intensivlikni tanlang" /></SelectTrigger>
                    <SelectContent>{intensities.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gender" className="text-right">Gender</Label>
                    <Select value={editingRecording.gender} onValueChange={(value) => setEditingRecording(prev => prev ? {...prev, gender: value} : null)}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Jinsni tanlang" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Erkak</SelectItem>
                            <SelectItem value="female">Ayol</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="age" className="text-right">Age</Label>
                <Input id="age" value={editingRecording.age} onChange={(e) => setEditingRecording(prev => prev ? {...prev, age: e.target.value} : null)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="region" className="text-right">Region</Label>
                <Select value={editingRecording.region} onValueChange={(value) => setEditingRecording(prev => prev ? {...prev, region: value} : null)}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Hududni tanlang" /></SelectTrigger>
                    <SelectContent>{regions.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Bekor qilish</Button>
              <Button onClick={handleSave}>Saqlash</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
