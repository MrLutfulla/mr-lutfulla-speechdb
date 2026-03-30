'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Mic, ShieldCheck, Info } from 'lucide-react';

const recordingSteps = [
  "Tinch joyda yozing va mikrofon og'zingizdan 15-20 sm uzoqlikda bo'lsin.",
  "Ekranda chiqqan matnni to'liq va ravon o'qing.",
  'Emotsiyani tanlaganingizdan keyin ovoz ohangini moslang.',
  'Saqlashdan oldin yozuvni qayta tinglab sifatini tekshiring.',
];

const qualityRules = [
  "Fonda musiqa yoki TV tovushi bo'lmasin.",
  "Juda past yoki juda baland gapirmang.",
  'Bir gapni bo\'lib yubormasdan to\'liq o\'qing.',
  'Mikrofonga urilish yoki shamol shovqinidan saqlaning.',
];

const faq = [
  {
    q: "Mikrofon ishlamasa nima qilaman?",
    a: 'Brauzer ruxsatlarini tekshiring va sahifani qayta yuklang. Agar kerak bo\'lsa, brauzer sozlamasidan mikrofonni qayta tanlang.',
  },
  {
    q: 'Yozuv saqlanmayapti, nima sabab?',
    a: 'Avval audio yozilganini va metadata (emosiya, jins, yosh, hudud va xususiyatlar) to\'liq kiritilganini tekshiring.',
  },
  {
    q: 'Bir matnni qayta yozsam bo\'ladimi?',
    a: 'Hozir tizim yangi matnlar bo\'yicha ishlaydi. Zarurat bo\'lsa admin orqali yozuvlar ko\'rib chiqiladi.',
  },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Info className="h-6 w-6 text-primary" />
                Yordam va yo'riqnoma
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Bu sahifa sizga sifatli audio yig'ish uchun kerakli qoidalarni beradi.
                Maqsad — toza, ravon va belgilangan emotsiyaga mos yozuvlar olish.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mic className="h-5 w-5 text-primary" />
                  Yozib olish bosqichlari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                  {recordingSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Sifat talablari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  {qualityRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Ko'p beriladigan savollar (FAQ)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faq.map((item) => (
                <div key={item.q} className="rounded-md border p-4">
                  <p className="font-medium">{item.q}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
