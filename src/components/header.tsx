import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { Logo } from './logo';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav>
          <Button asChild variant="ghost">
            <Link href="/history">
              <History className="mr-2 h-4 w-4" />
              Histórico
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
