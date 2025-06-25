'use client';

import * as React from 'react';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';

import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getRegistrationPrompt, registerMemberAction } from '@/lib/actions';

export default function RegisterPage() {
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [registrationPrompt, setRegistrationPrompt] = React.useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setCapturedImage('https://placehold.co/600x400.png');
      setIsCapturing(false);
    }, 1500);
  };

  const handleGeneratePrompt = async () => {
    const description = formRef.current?.querySelector<HTMLTextAreaElement>('#memberDescription')?.value;
    if (!description) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide a member description to generate a prompt.',
      });
      return;
    }
    setIsGeneratingPrompt(true);
    const result = await getRegistrationPrompt(description);
    setRegistrationPrompt(result.registrationPrompt);
    setIsGeneratingPrompt(false);
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!capturedImage) {
        toast({
            variant: "destructive",
            title: "Facial Capture Required",
            description: "Please capture an image for facial recognition.",
        });
        return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await registerMemberAction(formData);
    setIsSubmitting(false);

    if (result.success) {
        toast({
            title: "Registration Successful",
            description: result.message,
        });
        formRef.current?.reset();
        setCapturedImage(null);
        setRegistrationPrompt('');
    } else {
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: "An unexpected error occurred.",
        });
    }
  };


  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">New Member Registration</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Member Details</CardTitle>
            <CardDescription>Fill out the form to register a new church member.</CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required />
                  </div>
                   <div>
                    <Label htmlFor="memberDescription">Member Description</Label>
                    <Textarea id="memberDescription" name="memberDescription" placeholder="e.g., 'Regular attendee, participates in choir, volunteers for youth events.'" />
                  </div>
                   <div className="space-y-2">
                    <Button type="button" variant="secondary" onClick={handleGeneratePrompt} disabled={isGeneratingPrompt}>
                      {isGeneratingPrompt && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate Welcome Prompt with AI
                    </Button>
                    {registrationPrompt && <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">{registrationPrompt}</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <Label>Facial Capture</Label>
                  <div className="aspect-video w-full rounded-lg border-2 border-dashed bg-muted flex items-center justify-center relative overflow-hidden">
                    {isCapturing && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="mt-2">Capturing...</p>
                      </div>
                    )}
                    {capturedImage ? (
                      <Image src={capturedImage} alt="Captured face" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Camera className="h-12 w-12 mx-auto" />
                        <p className="mt-2">Camera preview will appear here</p>
                      </div>
                    )}
                  </div>
                  <Button type="button" onClick={handleCapture} className="w-full" disabled={isCapturing}>
                    <Camera className="mr-2 h-4 w-4" />
                    {capturedImage ? 'Retake Image' : 'Capture Image'}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register Member
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
