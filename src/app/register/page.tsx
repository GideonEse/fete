'use client';

import * as React from 'react';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';

import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { registerMemberAction } from '@/lib/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function RegisterPage() {
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [memberType, setMemberType] = React.useState('');
  const [hasCameraPermission, setHasCameraPermission] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API is not available in this browser.');
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [toast]);


  const handleCapture = () => {
    if (videoRef.current) {
        setIsCapturing(true);
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUri = canvas.toDataURL('image/png');
            setCapturedImage(dataUri);
        }
        setIsCapturing(false);
    }
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
    formData.append('memberType', memberType);
    formData.append('facialImage', capturedImage);
    const result = await registerMemberAction(formData);
    setIsSubmitting(false);

    if (result.success) {
        toast({
            title: "Registration Successful",
            description: result.message,
        });
        formRef.current?.reset();
        setCapturedImage(null);
        setMemberType('');
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
                    <Label htmlFor="memberType">Member Type</Label>
                    <Select name="memberType" onValueChange={setMemberType} value={memberType} required>
                      <SelectTrigger id="memberType">
                        <SelectValue placeholder="Select a member type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
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
                       <>
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                         {!hasCameraPermission && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center text-muted-foreground p-4">
                                <Camera className="h-12 w-12 mx-auto" />
                                <p className="mt-2">Camera preview will appear here.</p>
                                <Alert variant="destructive" className="mt-4">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>
                                        Please allow camera access to use this feature.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                       </>
                    )}
                  </div>
                  <Button type="button" onClick={capturedImage ? () => setCapturedImage(null) : handleCapture} className="w-full" disabled={isCapturing || !hasCameraPermission}>
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
