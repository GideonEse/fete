'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Users } from 'lucide-react';

interface MemberAppLayoutProps {
  children: React.ReactNode;
}

export default function MemberAppLayout({ children }: MemberAppLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you'd clear session/token here
    router.push('/');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <Link href="/member-dashboard" className="flex items-center gap-2 font-semibold">
          <Users className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg font-headline text-primary">VeriAttend</span>
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
      </main>
    </div>
  );
}
