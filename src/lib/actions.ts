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

export async function registerMemberAction(formData: FormData) {
    const name = formData.get('name');
    const matricNumber = formData.get('matricNumber');
    const memberType = formData.get('memberType');
    const facialImage = formData.get('facialImage');
    const password = formData.get('password');

    // In a real app, you would process the facial data and save everything to a database.
    console.log('Registering new member:', { name, matricNumber, memberType, hasImage: !!facialImage, password: '***' });

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network latency

    return { success: true, message: `Member ${name} registered successfully!` };
}
