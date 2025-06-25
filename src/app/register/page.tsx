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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/context/AppContext';

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [memberType, setMemberType] = React.useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { login, isInitialized } = useApp();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const identifier = (formData.get('identifier') as string);
    const password = formData.get('password') as string;
    const selectedMemberType = formData.get('memberType') as string;

    if (!selectedMemberType) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please select a member type.',
      });
      setIsLoading(false);
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
    const result = login(identifier, password, selectedMemberType);

    if (result.success) {
      toast({
        title: 'Login Successful',
        description: 'Welcome back! Redirecting...',
      });
      if (selectedMemberType === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/member-dashboard');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: `${result.message} ${selectedMemberType === 'admin' ? 'Hint: default is username "Admin" and password "password".' : ''}`,
      });
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
          <CardDescription>Please select your role and enter your credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memberType">I am a...</Label>
              <Select name="memberType" onValueChange={setMemberType} value={memberType} required>
                <SelectTrigger id="memberType">
                  <SelectValue placeholder="Select member type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="identifier">{memberType === 'admin' ? 'Username' : 'Matric Number'}</Label>
              <Input id="identifier" name="identifier" placeholder={memberType === 'admin' ? 'Admin' : 'e.g., U1234567A'} required />
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
            <Link href="/" className="underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
