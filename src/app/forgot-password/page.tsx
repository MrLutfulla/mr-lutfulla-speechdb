'use client';

import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Waves, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Parolni tiklash bo'yicha ko'rsatma e-pochtangizga yuborildi. Iltimos, e-pochta qutingizni tekshiring.");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-email') {
        setError("Iltimos, to'g'ri e-pochta manzilini kiriting.");
      } else {
        setError("Parolni tiklashda kutilmagan xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleResetPassword}>
          <CardHeader className="text-center">
            <div className="flex items-center gap-3 justify-center mb-4">
              <Waves className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-headline font-bold text-foreground">
                MrL Speech craft
              </h1>
            </div>
            <CardTitle className="text-2xl">Parolni tiklash</CardTitle>
            <CardDescription>Parolni tiklash uchun elektron pochta manzilingizni kiriting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Xatolik</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
             {success && (
              <Alert variant="default" className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Muvaffaqiyatli</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
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
                disabled={isSubmitting || !!success}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !!success}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yuborish'}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Kirish sahifasiga qaytish
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
