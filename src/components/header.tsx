import { Waves } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card shadow-sm">
      <div className="flex items-center gap-3">
        <Waves className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-headline font-bold text-foreground">
          MrL Speech craft
        </h1>
      </div>
    </header>
  );
}
