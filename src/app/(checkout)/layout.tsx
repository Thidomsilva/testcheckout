'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.14)-1px)] items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <Button
          variant="ghost"
          className="absolute -top-12 left-0 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        {children}
      </div>
    </div>
  );
}
