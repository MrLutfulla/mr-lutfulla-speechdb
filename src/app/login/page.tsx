'use client';

import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter, redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Waves, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!userLoading && user) {
      redirect('/');
    }
  }, [user, userLoading]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) return;

    setError(null);
    setIsSigningIn(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On successful login, the useUser hook will trigger the redirect
      router.push('/');
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError("Noto'g'ri e-pochta yoki parol.");
          break;
        case 'auth/invalid-email':
          setError("Iltimos, to'g'ri e-pochta manzilini kiriting.");
          break;
        default:
          setError("Tizimga kirishda kutilmagan xatolik yuz berdi.");
          break;
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  if (userLoading || (!userLoading && user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <div className="flex items-center gap-3 justify-center mb-4">
              <Waves className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-headline font-bold text-foreground">
                MrL Speech craft
              </h1>
            </div>
            <CardTitle className="text-2xl">Kirish</CardTitle>
            <CardDescription>Davom etish uchun hisobingizga kiring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Xatolik</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Elektron pochta</Label>
              <Input
                id="email"
                type="email"
                placeholder="siz@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSigningIn}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Parol</Label>
                 <Link href="/forgot-password" passHref legacyBehavior>
                    <a className="text-sm text-primary hover:underline">
                        Parol esingizdan chiqdimi?
                    </a>
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSigningIn}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSigningIn}>
              {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Kirish'}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center text-sm">
          <p className="text-muted-foreground">
            Hisobingiz yo'qmi?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Ro'yxatdan o'tish
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
