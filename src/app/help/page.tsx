'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function formatDuration(seconds: number = 0) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${hours} soat ${minutes} daqiqa ${remainingSeconds} soniya`;
}

export default function HelpPage() {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);
  const [totalRecordings, setTotalRecordings] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    if (firestore) {
      const fetchTotals = async () => {
        try {
          const usersCollection = collection(firestore, 'users');
          const userSnapshot = await getDocs(usersCollection);
          
          let totalRecs = 0;
          let totalDur = 0;
          userSnapshot.docs.forEach(doc => {
            const data = doc.data();
            totalRecs += data.recordingCount || 0;
            totalDur += data.totalDuration || 0;
          });

          setTotalRecordings(totalRecs);
          setTotalDuration(totalDur);

        } catch (error) {
          console.error("Error fetching totals:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchTotals();
    }
  }, [firestore]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-8">
        {loading ? (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        ) : (
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-xl text-center">Umumiy Yozuvlar Soni</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-bold text-center text-primary">{totalRecordings}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-xl text-center">Umumiy Yozuvlar Vaqti</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-center text-primary">{formatDuration(totalDuration)}</p>
                    </CardContent>
                </Card>
            </div>
        )}
      </main>
    </div>
  );
}
