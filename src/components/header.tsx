'use client';

import { Waves, LogOut, UserCog } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/admins';
import { useMemo } from 'react';

export function Header() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const userIsAdmin = useMemo(() => (user ? isAdmin(user.uid) : false), [user]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card shadow-sm">
      <div className="flex items-center gap-3">
        <Waves className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-headline font-bold text-foreground">
          MrL Speech craft
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {userIsAdmin && (
          <Button onClick={() => router.push('/admin')} variant="secondary" size="sm">
            <UserCog className="mr-2 h-4 w-4" />
            Admin Paneli
          </Button>
        )}
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Chiqish
        </Button>
      </div>
    </header>
  );
}
