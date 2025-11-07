import { Header } from '@/components/header';
import { SpeechCraftClient } from '@/components/speech-craft-client';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function Home() {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="flex-1 overflow-hidden">
          <SpeechCraftClient />
        </main>
      </div>
    </SidebarProvider>
  );
}
