'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';
import MemberAppLayout from '@/components/MemberAppLayout';

const memberData = {
  name: 'Marcus Thorne',
  matricNumber: 'U1234567S',
  avatar: 'https://placehold.co/100x100.png',
  attendanceRate: 85,
  totalPresent: 17,
  totalAbsent: 3,
  recentSessions: [
    { date: '2024-07-21', status: 'Present', time: '9:03 AM', remark: 'On-time' },
    { date: '2024-07-14', status: 'Present', time: '9:20 AM', remark: 'Late' },
    { date: '2024-07-07', status: 'Absent', time: '-', remark: '-' },
    { date: '2024-06-30', status: 'Present', time: '8:59 AM', remark: 'On-time' },
    { date: '2024-06-23', status: 'Present', time: '9:05 AM', remark: 'On-time' },
  ],
};

export default function MemberDashboardPage() {
  return (
    <MemberAppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={memberData.avatar} alt={memberData.name} data-ai-hint="person portrait" />
            <AvatarFallback>{memberData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold font-headline">{memberData.name}</h1>
            <p className="text-muted-foreground">{memberData.matricNumber}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{memberData.attendanceRate}%</div>
              <Progress value={memberData.attendanceRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sessions Attended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Check className="h-8 w-8 text-primary" />
                <span className="text-4xl font-bold">{memberData.totalPresent}</span>
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
                <span className="text-4xl font-bold">{memberData.totalAbsent}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance History</CardTitle>
            <CardDescription>Your last 5 attendance records.</CardDescription>
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
                {memberData.recentSessions.map((session, index) => (
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
