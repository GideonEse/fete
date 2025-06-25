'use server';

import { analyzeAttendanceData } from '@/ai/flows/analyze-attendance-data';

export async function getAttendanceAnalysis(query: string, attendanceData: string) {
  try {
    const result = await analyzeAttendanceData({ attendanceData, query });
    return result;
  } catch (error) {
    console.error('Error analyzing attendance data:', error);
    return { analysis: 'Could not perform analysis. Please try again.' };
  }
}
