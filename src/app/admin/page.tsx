
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { isAdmin } from '@/lib/admins';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, Timestamp, doc, getCountFromServer, getDocs } from 'firebase/firestore';
import { Loader2, Mic, Download, Copy, Trash2 } from 'lucide-react';
import { Header } from '@/components/header';
import { UserProfile, Recording } from '@/lib/types';
import { RecordingList } from '@/components/recording-list';
import { RecordingDetails } from '@/components/recording-details';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import JSZip from 'jszip';
import { useIsMobile } from '@/hooks/use-mobile';

function base64ToBlob(base64: string): Blob {
    const [header, data] = base64.split(',');
    const mime = header.match(/:(.*?);/)?.[1];
    const bstr = atob(data);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

function AdminPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRecordings, setUserRecordings] = useState<Recording[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [view, setView] = useState<'list' | 'recordings' | 'details'>('list');

  const userIsAdmin = !userLoading && user && isAdmin(user.uid);

  // Redirect non-admins
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    } else if (!userLoading && user && !isAdmin(user.uid)){
      router.push('/');
    }
  }, [user, userLoading, router]);
  
  // Reset view on screen size change
  useEffect(() => {
      if (!isMobile) {
          setView('list'); // Default to showing everything on desktop
      } else {
          if (selectedRecordingId) setView('details');
          else if (selectedUserId) setView('recordings');
          else setView('list');
      }
  }, [isMobile, selectedUserId, selectedRecordingId]);

  // Effect to load all users in real-time
  useEffect(() => {
    if (!firestore || !userIsAdmin) {
      if(!userLoading) setLoadingUsers(false);
      return;
    };

    setLoadingUsers(true);
    const usersCollection = collection(firestore, 'users');
    const unsubscribeUsers = onSnapshot(usersCollection, async (usersSnapshot) => {
      const usersDataPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userProfile = {
          ...(userDoc.data() as Omit<UserProfile, 'uid'>),
          uid: userDoc.id,
        } as UserProfile;

        try {
            const recordingsCol = collection(firestore, 'users', userDoc.id, 'recordings');
            const snapshot = await getCountFromServer(recordingsCol);
            userProfile.recordingCount = snapshot.data().count;
        } catch (e) {
            console.error(`Could not fetch recording count for user ${userDoc.id}`, e);
            userProfile.recordingCount = 0;
        }
        
        return userProfile;
      });

      const usersData = await Promise.all(usersDataPromises);
      setUsers(usersData);
      setLoadingUsers(false);
    }, (error) => {
        console.error("Error fetching users:", error);
        toast({
            title: "Xatolik",
            description: "Foydalanuvchilarni yuklab bo'lmadi.",
            variant: "destructive"
        });
        setLoadingUsers(false);
    });

    return () => unsubscribeUsers();
  }, [firestore, userIsAdmin, userLoading, toast]);

  // Effect to load recordings when a user is selected
  useEffect(() => {
    if (!firestore || !selectedUserId) {
        setUserRecordings([]);
        return;
    }

    setLoadingRecordings(true);
    const recordingsCollection = collection(firestore, 'users', selectedUserId, 'recordings');
    const q = query(recordingsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const recordingsData = snapshot.docs.map(doc => {
            const data = doc.data();
            let createdAt: string;
            if (data.createdAt instanceof Timestamp) {
                createdAt = data.createdAt.toDate().toISOString();
            } else if (typeof data.createdAt === 'string') {
                createdAt = data.createdAt;
            } else {
                createdAt = new Date().toISOString(); // Fallback
            }
            return {
                ...data,
                id: doc.id,
                createdAt,
            } as Recording;
        });
        setUserRecordings(recordingsData);
        setLoadingRecordings(false);
    }, (error) => {
        console.error(`Error fetching recordings for user ${selectedUserId}:`, error);
        toast({
            title: "Xatolik",
            description: "Foydalanuvchi yozuvlarini yuklab bo'lmadi.",
            variant: "destructive"
        });
        setLoadingRecordings(false);
    });

    return () => unsubscribe();
  }, [firestore, selectedUserId, toast]);


  const handleSelectUser = (uid: string) => {
    setSelectedUserId(uid);
    setSelectedRecordingId(null);
    if (isMobile) setView('recordings');
  };
  
  const handleSelectRecording = (id: string) => {
    setSelectedRecordingId(id);
    if (isMobile) setView('details');
  }
  
  const handleBack = () => {
      if (view === 'details') {
          setSelectedRecordingId(null);
          setView('recordings');
      } else if (view === 'recordings') {
          setSelectedUserId(null);
          setView('list');
      }
  }

  const showReadOnlyToast = () => {
      toast({
        variant: "destructive",
        title: "Ruxsat yo'q",
        description: "Admin bu amalni bajara olmaydi. Yozuvlar faqat ko'rish uchun.",
      });
  }

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    toast({
      title: "Nusxa olindi",
      description: "Foydalanuvchi UID'si vaqtinchalik xotiraga saqlandi.",
    });
  }

 const handleExportUserData = async (userId: string, userName: string | null) => {
    if (!firestore) return;

    toast({
      title: "Eksport boshlanmoqda...",
      description: `${userName || 'Foydalanuvchi'} ma'lumotlari yig'ilmoqda.`,
    });
    
    try {
        const zip = new JSZip();
        const metadata: any[] = [];
        const recordingsSnapshot = await getDocs(collection(firestore, 'users', userId, 'recordings'));

        if (recordingsSnapshot.empty) {
            toast({
              variant: "destructive",
              title: "Ma'lumot topilmadi",
              description: "Bu foydalanuvchi uchun eksport qilinadigan yozuvlar yo'q.",
            });
            return;
        }

        for (const recDoc of recordingsSnapshot.docs) {
          const recData = recDoc.data();
          const audioBase64 = recData.audioBase64;
          const fileName = `${recData.speakerId || 'unknown'}_${recDoc.id}.webm`;

          metadata.push({
            fileName,
            userId,
            recordingId: recDoc.id,
            ...recData,
            audioBase64: undefined, // Don't include base64 in metadata.json
          });

          if (audioBase64) {
            const audioBlob = base64ToBlob(audioBase64);
            zip.file(fileName, audioBlob);
          }
        }
        
        zip.file("metadata.json", JSON.stringify(metadata, null, 2));

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        const safeName = (userName || userId).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `speechcraft-export-${safeName}-${new Date().toISOString().split("T")[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
            title: "Eksport muvaffaqiyatli",
            description: `${userName || 'Foydalanuvchi'} ma'lumotlari ZIP faylga saqlandi.`,
        });

    } catch (err) {
        console.error("User export error:", err);
        toast({
            title: "Eksportda xatolik",
            description: "Ma'lumotlarni eksport qilishda kutilmagan xatolik yuz berdi.",
            variant: "destructive",
        });
    }
 };


  const handleExportAllData = async () => {
    if (!firestore) return;

    toast({
      title: "Eksport boshlanmoqda...",
      description: "Barcha ma'lumotlar yig'ilmoqda, bu biroz vaqt olishi mumkin.",
    });

    try {
      const zip = new JSZip();
      const allMetadata: any[] = [];
      const usersSnapshot = await getDocs(collection(firestore, 'users'));

      for (const userDoc of usersSnapshot.docs) {
        const recordingsSnapshot = await getDocs(collection(firestore, 'users', userDoc.id, 'recordings'));
        if (recordingsSnapshot.empty) continue;

        const userData = userDoc.data() as UserProfile;

        for (const recDoc of recordingsSnapshot.docs) {
          const rec = recDoc.data() as Omit<Recording, 'id'| 'audioBase64'>;
          const audioBase64 = recDoc.data().audioBase64;
          
          const fileName = `${rec.speakerId}_${recDoc.id}.webm`;
          
          allMetadata.push({
            fileName,
            userId: userDoc.id,
            userDisplayName: userData.displayName,
            userEmail: userData.email,
            recordingId: recDoc.id,
            ...rec,
          });

          if (audioBase64) {
            const audioBlob = base64ToBlob(audioBase64);
            zip.file(fileName, audioBlob);
          }
        }
      }

      if (allMetadata.length === 0) {
        toast({
          variant: "destructive",
          title: "Ma'lumot topilmadi",
          description: "Eksport uchun hech qanday yozuvlar topilmadi.",
        });
        return;
      }

      zip.file("metadata.json", JSON.stringify(allMetadata, null, 2));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `speechcraft-full-export-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Eksport muvaffaqiyatli",
        description: "Barcha yozuvlar va ma'lumotlar ZIP faylga saqlandi.",
      });

    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Eksportda xatolik",
        description: "Ma'lumotlarni eksport qilishda kutilmagan xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };
  
  const selectedRecording = useMemo(() => {
    return userRecordings.find(r => r.id === selectedRecordingId);
  }, [selectedRecordingId, userRecordings]);

  if (userLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!userIsAdmin) {
     return (
        <div className="flex flex-col h-screen bg-background">
         <Header />
         <div className="flex h-full w-full items-center justify-center bg-background p-4 text-center">
            <div className='max-w-md'>
                <h1 className="text-2xl font-bold text-destructive">Ruxsat yo'q</h1>
                <p className="text-muted-foreground mt-2">Bu sahifani ko'rish uchun sizda admin huquqlari mavjud emas.</p>
                <Button onClick={() => router.push('/')} className="mt-4">
                    Bosh sahifaga qaytish
                </Button>
            </div>
         </div>
       </div>
     );
  }

  const showUsersList = !isMobile || (isMobile && view === 'list');
  const showRecordingsList = !isMobile || (isMobile && view === 'recordings');
  const showDetails = !isMobile || (isMobile && view === 'details');

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Users List */}
        <div className={cn("w-full md:w-96 shrink-0 border-r bg-card flex flex-col", showUsersList ? "flex" : "hidden md:flex")}>
            <div className="p-4 border-b">
                 <h2 className="text-xl font-headline font-bold">Foydalanuvchilar ({users.length})</h2>
                 <Button onClick={handleExportAllData} variant="outline" size="sm" className="mt-2 w-full">
                    <Download className="mr-2 h-4 w-4" /> Barcha ma'lumotlarni eksport qilish
                </Button>
            </div>
            <ScrollArea>
                {loadingUsers ? (
                     <div className="p-4 space-y-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                     </div>
                ) : users.length === 0 ? (
                    <div className='text-center text-muted-foreground p-8'>
                        <p>Foydalanuvchilar topilmadi.</p>
                    </div>
                ) : (
                  users.map(u => (
                      <div
                          key={u.uid}
                          onClick={() => handleSelectUser(u.uid)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectUser(u.uid)}
                          className={cn(
                              'w-full text-left p-3 transition-colors flex items-start gap-3 border-b cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring',
                              selectedUserId === u.uid ? 'bg-accent' : 'hover:bg-accent/50'
                          )}
                      >
                          <Avatar className='h-9 w-9 mt-1'>
                              <AvatarImage src={u.photoURL || ''} alt={u.displayName || 'User'}/>
                              <AvatarFallback>{u.displayName?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className='flex-1 truncate'>
                              <p className='font-medium truncate flex items-center gap-2'>
                                  {u.displayName || 'Noma\'lum'}
                                  {isAdmin(u.uid) && <Badge variant="secondary">Admin</Badge>}
                              </p>
                              <p className={cn('text-sm', selectedUserId === u.uid ? 'text-accent-foreground/80' : 'text-muted-foreground')}>
                                  {u.recordingCount || 0} yozuv
                              </p>
                              <div className='flex items-center gap-2 mt-1'>
                                  <p className={cn('text-xs font-mono truncate', selectedUserId === u.uid ? 'text-accent-foreground/60' : 'text-muted-foreground/80')}>
                                      {u.uid}
                                  </p>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleCopyUid(u.uid); }}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleExportUserData(u.uid, u.displayName); }}>
                                    <Download className="h-3 w-3" />
                                  </Button>
                              </div>
                          </div>
                      </div>
                  ))
                )}
            </ScrollArea>
        </div>

        {/* Recordings List */}
        <div className={cn("w-full md:w-96 shrink-0 border-r bg-card flex flex-col", showRecordingsList ? "flex" : "hidden md:flex")}>
          <div className="p-4 border-b flex items-center gap-4">
            {isMobile && <Button variant="ghost" size="icon" onClick={handleBack}><Mic className="h-5 w-5" /></Button>}
            <h2 className="text-xl font-headline font-bold">Yozuvlar</h2>
          </div>
          {selectedUserId ? (
            <RecordingList 
                recordings={userRecordings} 
                selectedRecordingId={selectedRecordingId}
                onSelectRecording={handleSelectRecording}
                loading={loadingRecordings}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground p-4">
                <p>Tafsilotlarni ko'rish uchun foydalanuvchini tanlang</p>
            </div>
          )}
        </div>

        {/* Recording Details */}
        <main className={cn("flex-1", showDetails ? "block" : "hidden md:block")}>
             <ScrollArea className="h-full">
                <div className="p-4 md:p-8">
                {selectedRecording ? (
                     <RecordingDetails
                        key={selectedRecording.id}
                        recording={selectedRecording}
                        onUpdateRecording={showReadOnlyToast}
                        onDeleteRecording={showReadOnlyToast}
                        onClearSelection={handleBack}
                        isReadOnly={true}
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center bg-background text-muted-foreground p-8 min-h-[calc(100vh-10rem)]">
                        <Mic className="w-16 h-16 mb-4 text-muted-foreground/50" />
                        <h2 className="text-xl font-medium">Yozuvni tanlang</h2>
                        <p>Ko'rish uchun ro'yxatdan yozuvni tanlang.</p>
                    </div>
                )}
                </div>
             </ScrollArea>
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
