'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  PieChart,
  UserX,
  Loader2,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import type { Session } from '@/context/AppContext';

export default function DashboardPage() {
  const { loggedInUser, members, currentSession, sessionHistory, isInitialized } = useApp();
  const { toast } = useToast();

  const nonAdminMembers = React.useMemo(() => members.filter(m => m.memberType !== 'admin'), [members]);
  const totalMembers = nonAdminMembers.length;

  const dashboardStats = React.useMemo(() => {
    const totalSessions = sessionHistory.length;
    if (totalMembers === 0 || totalSessions === 0) {
      return { averageAttendance: 0, totalAbsences: 0 };
    }

    const totalPossibleAttendances = totalMembers * totalSessions;
    const totalActualAttendances = sessionHistory.reduce((sum, session) => sum + session.attendees.length, 0);

    const averageAttendance = totalPossibleAttendances > 0 
      ? Math.round((totalActualAttendances / totalPossibleAttendances) * 100) 
      : 0;
      
    const totalAbsences = totalPossibleAttendances - totalActualAttendances;

    return { averageAttendance, totalAbsences };
  }, [sessionHistory, totalMembers]);

  const chartData = React.useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const defaultChartData = monthNames.map(name => ({ name, total: 0 }));

    if (totalMembers === 0 || sessionHistory.length === 0) {
        return defaultChartData;
    }
    
    const monthlyAttendance: { [key: number]: number[] } = {};
    for (let i = 0; i < 12; i++) {
        monthlyAttendance[i] = [];
    }

    sessionHistory.forEach(session => {
        const month = new Date(session.startTime).getMonth();
        const attendancePercentage = (session.attendees.length / totalMembers) * 100;
        if (monthlyAttendance[month]) {
            monthlyAttendance[month].push(attendancePercentage);
        }
    });

    return monthNames.map((name, index) => {
        const monthData = monthlyAttendance[index];
        const average = monthData.length > 0
            ? monthData.reduce((a, b) => a + b, 0) / monthData.length
            : 0;
        return { name, total: parseFloat(average.toFixed(1)) };
    });
  }, [sessionHistory, totalMembers]);

  const handleExport = (sessionToExport: Session | undefined) => {
    if (!sessionToExport) {
      toast({
        variant: 'destructive',
        title: 'No Data to Export',
        description: 'There are no completed sessions in the history to export.',
      });
      return;
    }

    const allMembers = members.filter(m => m.memberType !== 'admin');
    const attendeesMap = new Map(sessionToExport.attendees.map(a => [a.id, a]));

    const exportData = allMembers.map(member => {
      const attendanceRecord = attendeesMap.get(member.id);
      if (attendanceRecord) {
        return {
          'Name': member.name,
          'Matric Number': member.matricNumber || 'N/A',
          'Status': 'Present',
          'Arrival Time': attendanceRecord.time,
          'Exit Time': attendanceRecord.exitTime || 'N/A',
        };
      } else {
        return {
          'Name': member.name,
          'Matric Number': member.matricNumber || 'N/A',
          'Status': 'Absent',
          'Arrival Time': 'N/A',
          'Exit Time': 'N/A',
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

    const columnWidths = [
        { wch: 25 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
    ];
    worksheet['!cols'] = columnWidths;

    const sessionDate = new Date(sessionToExport.startTime).toISOString().split('T')[0];
    XLSX.writeFile(workbook, `VeriAttend_Attendance_${sessionDate}.xlsx`);

    toast({
        title: 'Export Successful',
        description: 'The attendance report has been downloaded.',
    });
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

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={loggedInUser?.avatar} alt="Admin" data-ai-hint="person portrait" />
              <AvatarFallback>{loggedInUser?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {loggedInUser?.name}!</p>
            </div>
          </div>
           <div className="flex items-center space-x-2">
            <Button onClick={() => handleExport(sessionHistory?.[0])}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Latest Report
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.averageAttendance}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalAbsences}</div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-1 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle>Service Control</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Manage the live attendance session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/live-session">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {currentSession?.isActive ? 'View Live Session' : 'Start New Service'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle className="font-headline">Attendance Overview</CardTitle>
              <CardDescription>Average monthly attendance percentage.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <RechartsBarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
              <CardTitle className="font-headline">Session History</CardTitle>
              <CardDescription>A log of your 5 most recent sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionHistory.length > 0 ? (
                    sessionHistory.slice(0, 5).map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{new Date(session.startTime).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className="font-medium text-primary">{session.attendees.length}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-destructive">{totalMembers - session.attendees.length}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleExport(session)}>
                            Export
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">No session history found.</TableCell>
                     </TableRow>
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
