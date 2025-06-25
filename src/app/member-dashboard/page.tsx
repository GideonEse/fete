'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Check, Loader2, X } from 'lucide-react';
import MemberAppLayout from '@/components/MemberAppLayout';
import { useApp } from '@/context/AppContext';

// Mock data for history as we don't store it yet.
const recentSessions = [
    { date: '2024-07-21', status: 'Present', time: '9:03 AM', remark: 'On-time' },
    { date: '2024-07-14', status: 'Present', time: '9:20 AM', remark: 'Late' },
    { date: '2024-07-07', status: 'Absent', time: '-', remark: '-' },
    { date: '2024-06-30', status: 'Present', time: '8:59 AM', remark: 'On-time' },
    { date: '2024-06-23', status: 'Present', time: '9:05 AM', remark: 'On-time' },
];

const attendanceStats = {
  attendanceRate: 85,
  totalPresent: 17,
  totalAbsent: 3,
};


export default function MemberDashboardPage() {
    const { loggedInUser, isInitialized } = useApp();

    if (!isInitialized || !loggedInUser) {
        return (
          <MemberAppLayout>
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </MemberAppLayout>
        );
    }

  return (
    <MemberAppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={loggedInUser.avatar} alt={loggedInUser.name} data-ai-hint="person portrait" />
            <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold font-headline">{loggedInUser.name}</h1>
            <p className="text-muted-foreground">{loggedInUser.matricNumber}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{attendanceStats.attendanceRate}%</div>
              <Progress value={attendanceStats.attendanceRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sessions Attended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Check className="h-8 w-8 text-primary" />
                <span className="text-4xl font-bold">{attendanceStats.totalPresent}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sessions Missed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <X className="h-8 w-8 text-destructive" />
                <span className="text-4xl font-bold">{attendanceStats.totalAbsent}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance History</CardTitle>
            <CardDescription>Your last 5 attendance records. (Static demo data)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Arrival Time</TableHead>
                  <TableHead>Remark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSessions.map((session, index) => (
                  <TableRow key={index}>
                    <TableCell>{session.date}</TableCell>
                    <TableCell>
                      <Badge variant={session.status === 'Present' ? 'secondary' : 'destructive'}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{session.time}</TableCell>
                    <TableCell>
                      <span className={session.remark === 'Late' ? 'font-semibold text-accent' : 'text-muted-foreground'}>
                        {session.remark}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MemberAppLayout>
  );
}
