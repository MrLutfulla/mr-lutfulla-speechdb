import { Header } from '@/components/header';
import { SpeechCraftClient } from '@/components/speech-craft-client';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-hidden">
        <SpeechCraftClient />
      </main>
    </div>
  );
}
