import { Wallet } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2" aria-label="FlexiPay Home">
      <Wallet className="h-7 w-7 text-primary" />
      <span className="text-2xl font-black text-foreground font-headline tracking-tighter">FlexiPay</span>
    </div>
  );
}
