'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { isAdmin } from '@/lib/admins';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, getDocs, Timestamp, getCountFromServer } from 'firebase/firestore';
import { Loader2, Mic } from 'lucide-react';
import { Header } from '@/components/header';
import { UserProfile, Recording } from '@/lib/types';
import { RecordingList } from '@/components/recording-list';
import { RecordingDetails } from '@/components/recording-details';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  
  const userIsAdmin = !userLoading && user && isAdmin(user.uid);

  // Redirect non-admins
  useEffect(() => {
    if (!userLoading && !userIsAdmin) {
      router.push('/');
    }
  }, [user, userLoading, userIsAdmin, router]);

  // Effect to load all users
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
          recordingCount: 0, // Default to 0
        };

        // Efficiently get recording count
        try {
          const recordingsCollection = collection(firestore, 'users', userDoc.id, 'recordings');
          const snapshot = await getCountFromServer(recordingsCollection);
          userProfile.recordingCount = snapshot.data().count;
        } catch (error) {
          console.error(`Failed to get recording count for user ${userDoc.id}:`, error);
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
            // Handle both Timestamp and ISO string formats for createdAt
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
  };
  
  const handleSelectRecording = (id: string) => {
    setSelectedRecordingId(id);
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

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Users List */}
        <div className="w-full md:w-96 shrink-0 border-r bg-card flex flex-col">
            <div className="p-4 border-b">
                 <h2 className="text-xl font-headline font-bold">Foydalanuvchilar ({users.length})</h2>
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
                      <button
                          key={u.uid}
                          onClick={() => handleSelectUser(u.uid)}
                          className={cn(
                              'w-full text-left p-3 transition-colors flex items-start gap-3 border-b',
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyUid(u.uid);
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                              </div>
                          </div>
                      </button>
                  ))
                )}
            </ScrollArea>
        </div>

        {/* Recordings List */}
        <div className="w-full md:w-96 shrink-0 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
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
        <main className="flex-1">
             <ScrollArea className="h-full">
                <div className="p-4 md:p-8">
                {selectedRecording ? (
                     <RecordingDetails
                        key={selectedRecording.id}
                        recording={selectedRecording}
                        onUpdateRecording={showReadOnlyToast}
                        onDeleteRecording={showReadOnlyToast}
                        onClearSelection={() => setSelectedRecordingId(null)}
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