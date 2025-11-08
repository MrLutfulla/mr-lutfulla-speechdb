'use client';

import { useAuth, useUser, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter, redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Waves, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserProfile } from '@/lib/types';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    if (!userLoading && user) {
      redirect('/');
    }
  }, [user, userLoading]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    setError(null);
    setIsSigningUp(true);

    if (password.length < 6) {
        setError("Parol kamida 6 belgidan iborat bo'lishi kerak.");
        setIsSigningUp(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Update user profile (display name)
      await updateProfile(newUser, { displayName });

      // Create user document in Firestore
      const userRef = doc(firestore, 'users', newUser.uid);
      const userData: Partial<UserProfile> = {
        uid: newUser.uid,
        email: newUser.email,
        displayName: displayName,
        photoURL: newUser.photoURL,
        recordingCount: 0,
      };
      await setDoc(userRef, userData, { merge: true });

      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-pochta manzili allaqachon ro‘yxatdan o‘tgan.');
      } else {
        setError("Ro'yxatdan o'tishda kutilmagan xatolik yuz berdi.");
      }
    } finally {
      setIsSigningUp(false);
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
        <form onSubmit={handleSignup}>
          <CardHeader className="text-center">
             <div className="flex items-center gap-3 justify-center mb-4">
              <Waves className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-headline font-bold text-foreground">
                MrL Speech craft
              </h1>
            </div>
            <CardTitle className="text-2xl">Ro'yxatdan o'tish</CardTitle>
            <CardDescription>Yangi hisob yaratish</CardDescription>
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
              <Label htmlFor="displayName">Ism</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Ismingiz"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isSigningUp}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Elektron pochta</Label>
              <Input
                id="email"
                type="email"
                placeholder="siz@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSigningUp}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSigningUp}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSigningUp}>
              {isSigningUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Hisob yaratish"}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center text-sm">
          <p className="text-muted-foreground">
            Hisobingiz bormi?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Kirish
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}