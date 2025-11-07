'use client';

import { Waves, LogOut } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export function Header() {
  const auth = useAuth();
  const router = useRouter();

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
      <Button variant="ghost" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Chiqish
      </Button>
    </header>
  );
}
