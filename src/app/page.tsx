'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const matricNumber = formData.get('matricNumber') as string;

    // In a real app, you would authenticate the user here.
    // For now, we'll just simulate a successful login and redirect based on a simple rule.
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Login Successful',
      description: 'Welcome back! Redirecting...',
    });

    if (matricNumber.toLowerCase() === 'admin') {
        router.push('/dashboard');
    } else {
        router.push('/member-dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                 <div className="group flex h-14 w-14 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-12 md:w-12 md:text-base">
                    <Users className="h-6 w-6 transition-all group-hover:scale-110" />
                    <span className="sr-only">VeriAttend</span>
                </div>
            </div>
          <CardTitle className="text-2xl">Member Login</CardTitle>
          <CardDescription>Enter your matriculation number. Use 'admin' to access the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matricNumber">Matric Number</Label>
              <Input id="matricNumber" name="matricNumber" placeholder="e.g., U1234567A or admin" required />
            </div>
            <div className="space-y-2">
                <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="ml-auto inline-block text-sm underline">
                        Forgot your password?
                    </Link>
                </div>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
