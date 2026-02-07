'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { regions } from '@/lib/sentences';

interface UserProfile {
  displayName: string;
  email: string;
  age: string;
  gender: 'male' | 'female';
  region: string;
}

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && firestore) {
      const fetchProfile = async () => {
        setLoading(true);
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setProfile(userDocSnap.data() as UserProfile);
        } else {
          // Create a default profile if it doesn't exist
          const defaultProfile: UserProfile = {
            displayName: user.displayName || '',
            email: user.email || '',
            age: '',
            gender: 'male',
            region: 'toshkent',
          };
          setProfile(defaultProfile);
        }
        setLoading(false);
      };
      fetchProfile();
    }
  }, [user, firestore]);

  const handleSave = async () => {
    if (!user || !firestore || !profile) return;
    setSaving(true);
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: profile.displayName,
        age: profile.age,
        gender: profile.gender,
        region: profile.region,
      });
      alert('Ma\'lumotlaringiz muvaffaqiyatli saqlandi!');
    } catch (error) {
      console.error("Error updating profile: ", error);
      alert('Ma\'lumotlarni saqlashda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile(prev => prev ? { ...prev, [id]: value } : null);
  };

  const handleSelectChange = (id: keyof UserProfile, value: string) => {
    setProfile(prev => prev ? { ...prev, [id]: value } : null);
  };

  if (loading || authLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Iltimos, tizimga kiring.</p></div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Mening Hisob Yozuvim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Ism</Label>
                <Input id="displayName" value={profile?.displayName || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Elektron Pochta</Label>
                <Input id="email" value={profile?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Yosh</Label>
                <Input id="age" type="number" value={profile?.age || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Jins</Label>
                <Select value={profile?.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Jinsingizni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkak</SelectItem>
                    <SelectItem value="female">Ayol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Hudud</Label>
                <Select value={profile?.region} onValueChange={(value) => handleSelectChange('region', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hududingizni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Saqlash
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
