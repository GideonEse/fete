'use client';

import * as React from 'react';
import Image from 'next/image';
import { Camera, VideoOff } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { members } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Attendee = {
  id: string;
  name: string;
  avatar: string;
  time: string;
  status: 'On-time' | 'Late';
};

export default function LiveSessionPage() {
  const [liveLog, setLiveLog] = React.useState<Attendee[]>([]);
  const [isSessionActive, setIsSessionActive] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout>();
  const detectedIds = React.useRef(new Set());

  const startSession = () => {
    setIsSessionActive(true);
    detectedIds.current.clear();
    setLiveLog([]);
    intervalRef.current = setInterval(() => {
      const availableMembers = members.filter(m => !detectedIds.current.has(m.id));
      if (availableMembers.length === 0) {
        clearInterval(intervalRef.current);
        setIsSessionActive(false);
        return;
      }

      const randomMember = availableMembers[Math.floor(Math.random() * availableMembers.length)];
      detectedIds.current.add(randomMember.id);
      
      const now = new Date();
      const arrivalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isLate = now.getMinutes() > 15;

      const newAttendee: Attendee = {
        ...randomMember,
        time: arrivalTime,
        status: isLate ? 'Late' : 'On-time',
      };

      setLiveLog(prev => [newAttendee, ...prev]);
    }, 3000);
  };
  
  const stopSession = () => {
    setIsSessionActive(false);
    if(intervalRef.current) {
        clearInterval(intervalRef.current);
    }
  };

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Live Attendance Session</h1>
          <Button onClick={isSessionActive ? stopSession : startSession} variant={isSessionActive ? 'destructive' : 'default'}>
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
                {isSessionActive ? (
                    <Image src="https://placehold.co/1280x720.png" alt="Live camera feed" layout="fill" objectFit="cover" data-ai-hint="security camera" />
                ) : (
                    <div className="text-center text-muted-foreground">
                        <VideoOff className="h-16 w-16 mx-auto" />
                        <p className="mt-4">Session is not active. Start the session to begin attendance.</p>
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
              {liveLog.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    <p>Waiting for attendees...</p>
                </div>
              )}
              {liveLog.map((attendee) => (
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
                  <Badge
                    className={cn(
                      attendee.status === 'Late'
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : 'bg-green-100 text-green-800 border-green-200'
                    )}
                    variant="outline"
                  >
                    {attendee.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
