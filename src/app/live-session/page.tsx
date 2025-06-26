'use client';

import * as React from 'react';
import { AlertTriangle, Camera, Loader2, VideoOff } from 'lucide-react';
import * as faceapi from 'face-api.js';

import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';
import type { Member } from '@/context/AppContext';
import { loadModels } from '@/lib/face-api';

export default function LiveSessionPage() {
  const { members, currentSession, startSession, stopSession, addAttendee, isInitialized } = useApp();
  const [hasCameraPermission, setHasCameraPermission] = React.useState(false);
  const [modelsLoaded, setModelsLoaded] = React.useState(false);
  const [modelError, setModelError] = React.useState<string | null>(null);
  const [isDetecting, setIsDetecting] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const recognitionIntervalRef = React.useRef<NodeJS.Timeout>();
  const isDetectingRef = React.useRef(false);
  const faceMatcherRef = React.useRef<faceapi.FaceMatcher | null>(null);
  const { toast } = useToast();
  
  // Get camera permission and load models
  React.useEffect(() => {
    const setup = async () => {
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
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
      
      try {
        await loadModels();
        setModelsLoaded(true);
      } catch (error) {
        setModelError('Could not load recognition models. Please refresh the page.');
        toast({
          variant: 'destructive',
          title: 'Model Loading Failed',
          description: 'Could not load recognition models. Please refresh the page.',
        });
      }
    };

    setup();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
      }
    };
  }, [toast]);
  
  // Create face matcher when models are loaded or members change
  React.useEffect(() => {
    if (modelsLoaded && members.length > 0) {
      const membersWithDescriptors = members.filter(
        (m): m is Member & { faceDescriptor: number[] } =>
          m.memberType !== 'admin' && !!m.faceDescriptor && Array.isArray(m.faceDescriptor)
      );

      if (membersWithDescriptors.length > 0) {
        try {
          const labeledFaceDescriptors = membersWithDescriptors.map(
            (member) =>
              new faceapi.LabeledFaceDescriptors(member.id, [new Float32Array(member.faceDescriptor)])
          );
          faceMatcherRef.current = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
        } catch (error) {
            console.error("Failed to create FaceMatcher:", error);
            toast({
                variant: 'destructive',
                title: 'Recognition Error',
                description: 'Could not initialize face recognition engine.'
            });
        }
      } else {
        faceMatcherRef.current = null;
      }
    }
  }, [members, modelsLoaded, toast]);
  
  // Facial recognition loop
  React.useEffect(() => {
    if (!currentSession?.isActive) {
      if (recognitionIntervalRef.current) clearInterval(recognitionIntervalRef.current);
      return;
    }

    recognitionIntervalRef.current = setInterval(async () => {
      if (
        !hasCameraPermission ||
        !modelsLoaded ||
        !videoRef.current ||
        !faceMatcherRef.current ||
        isDetectingRef.current
      ) {
        return;
      }

      isDetectingRef.current = true;
      setIsDetecting(true);

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        const attendeesIds = new Set(currentSession.attendees.map((a) => a.id));

        for (const detection of detections) {
          const bestMatch = faceMatcherRef.current.findBestMatch(detection.descriptor);
          if (bestMatch.label !== 'unknown' && !attendeesIds.has(bestMatch.label)) {
            addAttendee(bestMatch.label);
          }
        }
      } catch (error) {
        console.error('Error during face recognition:', error);
      } finally {
        isDetectingRef.current = false;
        setIsDetecting(false);
      }
    }, 2000);

    return () => {
      if (recognitionIntervalRef.current) clearInterval(recognitionIntervalRef.current);
    };
  }, [currentSession, hasCameraPermission, modelsLoaded, addAttendee]);


  const handleStartSession = () => {
    // Prerequisite checks
    if (!hasCameraPermission) {
      toast({
        variant: 'destructive',
        title: 'Cannot Start Session',
        description: 'Camera access is required to start a live session.',
      });
      return;
    }
    if (modelError || !modelsLoaded) {
      toast({
        variant: 'destructive',
        title: 'Cannot Start Session',
        description: modelError || 'Recognition models are still loading.',
      });
      return;
    }

    const nonAdminMembers = members.filter(m => m.memberType !== 'admin');
    
    // Check if there are any members to track
    if (nonAdminMembers.length === 0) {
      toast({
        title: 'No Members to Track',
        description: 'There are no registered student or staff members.',
      });
      return;
    }

    const membersWithDescriptors = nonAdminMembers.filter(m => !!m.faceDescriptor && Array.isArray(m.faceDescriptor));

    // Case 1: Members exist, but NONE have facial data. This is a hard stop.
    if (membersWithDescriptors.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Recognition Not Ready',
            description: 'No members have registered facial data. Please register at least one member with a facial scan before starting a session.',
        });
        return;
    }
    
    // Case 2: The face matcher is still being created from the descriptors. This is a temporary "warming up" state.
    if (!faceMatcherRef.current) {
      toast({
        title: 'Recognition Initializing',
        description: 'Face recognition engine is warming up. Please try again in a moment.',
      });
      return;
    }

    // All checks passed, start the session.
    startSession();
  };
  
  if (!isInitialized) {
    return (
      <AppLayout>
        <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const isSessionActive = currentSession?.isActive ?? false;

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Live Attendance Session</h1>
          <Button onClick={isSessionActive ? stopSession : handleStartSession} variant={isSessionActive ? 'destructive' : 'default'} disabled={!hasCameraPermission && !isSessionActive}>
            {isSessionActive ? 'End Session' : 'Start Session'}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-6 w-6" />
                Live Camera Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full rounded-lg border-2 border-dashed bg-muted flex items-center justify-center relative overflow-hidden">
                <video ref={videoRef} className={cn("w-full h-full object-cover", !hasCameraPermission && "hidden")} autoPlay muted playsInline />
                
                {!hasCameraPermission && (
                    <div className="text-center text-muted-foreground p-4">
                        <VideoOff className="h-16 w-16 mx-auto" />
                        <p className="mt-4">Camera access denied.</p>
                        <Alert variant="destructive" className="mt-4">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser settings to use this feature.
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

                {!modelError && hasCameraPermission && !modelsLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center text-muted-foreground p-4">
                    <Loader2 className="h-16 w-16 mx-auto animate-spin" />
                    <p className="mt-4">Loading recognition models...</p>
                  </div>
                )}

                {hasCameraPermission && modelsLoaded && !isSessionActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center text-muted-foreground p-4">
                        <VideoOff className="h-16 w-16 mx-auto" />
                        <p className="mt-4">Session is not active. Start the session to begin attendance.</p>
                    </div>
                )}

                {isSessionActive && isDetecting && (
                  <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-primary/80 px-3 py-1 text-xs text-primary-foreground backdrop-blur-sm">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Live Attendance Log</CardTitle>
            </CardHeader>
            <CardContent className="h-[60vh] overflow-y-auto space-y-4">
              {!currentSession || currentSession.attendees.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    <p>{isSessionActive ? 'Waiting for attendees...' : 'Session not started.'}</p>
                </div>
              ) : (
                currentSession.attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 animate-in fade-in-0 slide-in-from-bottom-5 duration-500"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={attendee.avatar} alt={attendee.name} />
                      <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{attendee.name}</p>
                      <p className="text-sm text-muted-foreground">{attendee.time}</p>
                    </div>
                    <Badge variant={attendee.status === 'On-time' ? 'secondary' : 'destructive'}>
                      {attendee.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
