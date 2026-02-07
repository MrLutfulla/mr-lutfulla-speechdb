'use client';

import { Waves, LogOut, UserCog, ChevronDown, User as UserIcon } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/admins';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const userIsAdmin = useMemo(() => (user ? isAdmin(user.uid) : false), [user]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/help', label: 'Help' },
  ];

  return (
    <header className="flex items-center justify-between px-8 py-3 border-b bg-card shadow-sm">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Waves className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            MrL Speech Craft
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <span className={`transition-colors hover:text-primary ${pathname === link.href ? 'text-primary' : 'text-muted-foreground'}`}>
                {link.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
      
      {user && (
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className='h-8 w-8'>
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'}/>
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.displayName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Mening hisobim</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {userIsAdmin && (
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Admin Paneli</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push('/account')}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Mening hisob yozuvim</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Chiqish</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
