'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Camera, Loader2 } from 'lucide-react';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { getFaceDescriptor, loadModels } from '@/lib/face-api';

export default function RegisterPage() {
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [memberType, setMemberType] = React.useState('');
  const [hasCameraPermission, setHasCameraPermission] = React.useState(false);
  const [modelsLoaded, setModelsLoaded] = React.useState(false);
  const [modelError, setModelError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const { addMember, login } = useApp();
  const router = useRouter();


  React.useEffect(() => {
    const initFaceApi = async () => {
      try {
        await loadModels();
        setModelsLoaded(true);
      } catch (error) {
        setModelError('Could not load recognition models. Facial registration is unavailable. Please refresh and try again.');
        toast({
          variant: 'destructive',
          title: 'Model Loading Failed',
          description: 'Could not load recognition models. Please refresh the page.',
        });
      }
    };

    if (memberType === 'admin') {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setHasCameraPermission(false);
      return;
    }
    
    initFaceApi();

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
  }, [toast, memberType]);


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
    if (memberType !== 'admin' && !capturedImage) {
        toast({
            variant: "destructive",
            title: "Facial Capture Required",
            description: "Please capture an image for facial recognition.",
        });
        return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const matricNumber = formData.get('matricNumber') as string;
    const password = formData.get('password') as string;
    const currentMemberType = formData.get('memberType') as 'student' | 'staff' | 'admin';

    const memberData: any = {
        name,
        password,
        memberType: currentMemberType,
    };

    if (currentMemberType !== 'admin') {
        memberData.matricNumber = matricNumber;
        memberData.facialImage = capturedImage;
        
        const descriptor = await getFaceDescriptor(capturedImage!);
        if (!descriptor) {
            toast({
                variant: 'destructive',
                title: 'Facial Capture Failed',
                description: 'No face detected in the image. Please retake your photo and try again.',
            });
            setIsSubmitting(false);
            return;
        }
        memberData.faceDescriptor = Array.from(descriptor);
    }

    const result = addMember(memberData);

    if (result.success) {
        toast({
            title: "Registration Successful",
            description: "Logging you in...",
        });

        const identifier = currentMemberType === 'admin' ? name : matricNumber;
        const loginResult = login(identifier, password, currentMemberType);

        if (loginResult.success) {
            if (currentMemberType === 'admin') {
                router.push('/dashboard');
            } else {
                router.push('/member-dashboard');
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Auto-Login Failed',
                description: 'Please try logging in manually.',
            });
            router.push('/');
        }
    } else {
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: result.message,
        });
        setIsSubmitting(false);
    }
  };

  const isFacialRegReady = hasCameraPermission && modelsLoaded;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className={cn("w-full transition-all", memberType === 'admin' ? 'max-w-md' : 'max-w-3xl')}>
          <CardHeader>
            <CardTitle className="text-2xl">New Member Registration</CardTitle>
            <CardDescription>Fill out the form to register a new church member.</CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
              <div className={cn("grid grid-cols-1 gap-8", memberType !== 'admin' && "md:grid-cols-2")}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">{memberType === 'admin' ? 'Username' : 'Full Name'}</Label>
                    <Input id="name" name="name" placeholder={memberType === 'admin' ? 'Admin' : 'John Doe'} required />
                  </div>
                  {memberType !== 'admin' && (
                    <div>
                      <Label htmlFor="matricNumber">Matric Number</Label>
                      <Input id="matricNumber" name="matricNumber" type="text" placeholder="e.g., U1234567A" required />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
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
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {memberType !== 'admin' && (
                  <div className="space-y-4">
                    <Label>Facial Capture</Label>
                    <div className="aspect-video w-full rounded-lg border-2 border-dashed bg-muted flex items-center justify-center relative overflow-hidden">
                      {isCapturing && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <p className="mt-2">Capturing...</p>
                        </div>
                      )}
                      
                      <video 
                          ref={videoRef} 
                          className={cn("w-full h-full object-cover", { 'hidden': !!capturedImage })}
                          autoPlay
                          muted 
                          playsInline 
                      />
                       {capturedImage && (
                        <Image src={capturedImage} alt="Captured face" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      )}

                      {!hasCameraPermission && !capturedImage && (
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
                      
                      {modelError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/90 text-center text-destructive-foreground p-4">
                          <AlertTriangle className="h-12 w-12 mx-auto" />
                          <p className="mt-4 font-semibold">Model Loading Failed</p>
                          <p className="mt-1 text-sm">{modelError}</p>
                        </div>
                      )}

                      {!modelError && hasCameraPermission && !modelsLoaded && !capturedImage && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center text-muted-foreground p-4">
                            <Loader2 className="h-12 w-12 mx-auto animate-spin" />
                            <p className="mt-2">Loading recognition models...</p>
                        </div>
                      )}
                    </div>
                    <Button type="button" onClick={capturedImage ? () => setCapturedImage(null) : handleCapture} className="w-full" disabled={isCapturing || !isFacialRegReady}>
                      <Camera className="mr-2 h-4 w-4" />
                      {capturedImage ? 'Retake Image' : 'Capture Image'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4">
                 <div className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/" className="underline font-medium text-primary">
                      Login
                    </Link>
                  </div>
                <Button type="submit" disabled={isSubmitting || (memberType !== 'admin' && !isFacialRegReady)}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register Member
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  );
}
