'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BarChart,
  CheckCircle2,
  Clock,
  Loader2,
  Users,
} from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/components/AppLayout';
import { getAttendanceAnalysis } from '@/lib/actions';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

// Chart data can remain mocked for visual representation
const chartData = [
  { name: 'Jan', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Feb', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Mar', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Apr', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'May', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Jun', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Jul', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Aug', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Sep', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Oct', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Nov', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Dec', total: Math.floor(Math.random() * 100) + 50 },
].map(item => ({ ...item, total: (item.total / 200) * 100 }));


export default function DashboardPage() {
  const { loggedInUser, members, currentSession, isInitialized } = useApp();
  const [analysisResult, setAnalysisResult] = React.useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = React.useState(false);
  const { toast } = useToast();

  const handleAnalysis = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const attendanceDataString = currentSession?.attendees
        .map(a => `${a.name}, ${a.time}`)
        .join('\n') ?? '';
    
    if (!attendanceDataString) {
        toast({
            variant: 'destructive',
            title: 'No Data',
            description: 'There is no attendance data from the current session to analyze.',
        });
        return;
    }

    const formData = new FormData(event.currentTarget);
    const query = formData.get('query') as string;

    if (!query) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a query for analysis.',
      });
      return;
    }

    setIsLoadingAnalysis(true);
    setAnalysisResult('');
    try {
      const result = await getAttendanceAnalysis(query, attendanceDataString);
      setAnalysisResult(result.analysis);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze attendance data.',
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
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
  
  const presentCount = currentSession?.attendees?.length ?? 0;
  const lateCount = currentSession?.attendees?.filter(a => a.status === 'Late').length ?? 0;
  const totalMembers = members.filter(m => m.memberType !== 'admin').length;
  const recentActivity = currentSession?.attendees.slice(0, 4) ?? [];

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
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latecomers</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lateCount}</div>
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
              <CardTitle className="font-headline">Recent Activity</CardTitle>
              <CardDescription>An overview of the latest check-ins.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Arrival Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.name}</TableCell>
                      <TableCell>{activity.time}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${activity.status === 'On-time' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                          {activity.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                   {recentActivity.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No activity yet for this session.</TableCell>
                     </TableRow>
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">AI Attendance Analysis</CardTitle>
            <CardDescription>Ask questions about the current session's attendance data to get insights.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalysis} className="space-y-4">
              <Textarea
                name="query"
                placeholder="e.g., 'Who arrived earliest?' or 'List all members who were late.'"
                className="min-h-[100px]"
              />
              <Button type="submit" disabled={isLoadingAnalysis}>
                {isLoadingAnalysis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Data
              </Button>
            </form>
            {analysisResult && (
              <div className="mt-4 rounded-lg border bg-secondary/50 p-4">
                <h4 className="font-semibold mb-2">Analysis Result:</h4>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{analysisResult}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
