'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { isAdmin } from '@/lib/admins';
import { useRouter } from 'next/navigation';
import { collectionGroup, onSnapshot, query, collection, orderBy } from 'firebase/firestore';
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
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allRecordings, setAllRecordings] = useState<Map<string, Recording[]>>(new Map());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!userLoading && !isAdmin(user?.uid || '')) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!firestore || !isAdmin(user?.uid || '')) return;

    setLoading(true);
    const usersCollection = collection(firestore, 'users');
    const unsubscribeUsers = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({...doc.data(), uid: doc.id} as UserProfile));
      setUsers(usersData);
    });
    
    const recordingsQuery = query(collectionGroup(firestore, 'recordings'), orderBy('createdAt', 'desc'));
    const unsubscribeRecordings = onSnapshot(recordingsQuery, (snapshot) => {
      const recordingsMap = new Map<string, Recording[]>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const recording = { 
            ...data, 
            id: doc.id,
            createdAt: data.createdAt.toDate().toISOString(),
        } as Recording;
        const userId = doc.ref.parent.parent?.id;
        if (userId) {
          const userRecordings = recordingsMap.get(userId) || [];
          userRecordings.push(recording);
          recordingsMap.set(userId, userRecordings);
        }
      });

      // Update recording counts on users
      setUsers(prevUsers => prevUsers.map(u => ({...u, recordingCount: recordingsMap.get(u.uid)?.length || 0})))

      setAllRecordings(recordingsMap);
      setLoading(false);
    });


    return () => {
      unsubscribeUsers();
      unsubscribeRecordings();
    };
  }, [firestore, user]);

  const handleSelectUser = (uid: string) => {
    setSelectedUserId(uid);
    setSelectedRecordingId(null); // Reset recording selection when user changes
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

  const selectedUserRecordings = useMemo(() => {
    if (!selectedUserId) return [];
    return allRecordings.get(selectedUserId) || [];
  }, [selectedUserId, allRecordings]);

  const selectedRecording = useMemo(() => {
    return selectedUserRecordings.find(r => r.id === selectedRecordingId);
  }, [selectedRecordingId, selectedUserRecordings]);

  if (userLoading || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAdmin(user?.uid || '')) {
    return null;
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
                {users.map(u => (
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
                ))}
            </ScrollArea>
        </div>

        {/* Recordings List */}
        <div className="w-full md:w-96 shrink-0 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-headline font-bold">Yozuvlar</h2>
          </div>
          {selectedUserId ? (
            <RecordingList 
                recordings={selectedUserRecordings} 
                selectedRecordingId={selectedRecordingId}
                onSelectRecording={handleSelectRecording}
                loading={loading}
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
