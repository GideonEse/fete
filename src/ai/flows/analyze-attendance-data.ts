'use server';
/**
 * @fileOverview A flow to analyze attendance data and provide insights.
 *
 * - analyzeAttendanceData - A function that analyzes attendance data and provides insights.
 * - AnalyzeAttendanceDataInput - The input type for the analyzeAttendanceData function.
 * - AnalyzeAttendanceDataOutput - The return type for the analyzeAttendanceData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAttendanceDataInputSchema = z.object({
  attendanceData: z
    .string()
    .describe("A string containing attendance records. Each line should represent one record and contain the member's name, arrival timestamp, status, and optionally an exit timestamp."),
  query: z.string().describe('The specific question or request for analysis of the attendance data.'),
});
export type AnalyzeAttendanceDataInput = z.infer<
  typeof AnalyzeAttendanceDataInputSchema
>;

const AnalyzeAttendanceDataOutputSchema = z.object({
  analysis: z.string().describe('The analysis of the attendance data.'),
});
export type AnalyzeAttendanceDataOutput = z.infer<
  typeof AnalyzeAttendanceDataOutputSchema
>;

export async function analyzeAttendanceData(
  input: AnalyzeAttendanceDataInput
): Promise<AnalyzeAttendanceDataOutput> {
  return analyzeAttendanceDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'attendanceAnalysisPrompt',
  input: {
    schema: AnalyzeAttendanceDataInputSchema,
  },
  output: {
    schema: AnalyzeAttendanceDataOutputSchema,
  },
  prompt: `You are an expert attendance data analyst. You will be provided with attendance records and a specific question or request for analysis. Your task is to analyze the data and provide a clear and concise answer to the question.

The data includes member names, arrival times, their status (On-time or Late), and exit times.

Attendance Data:
{{{attendanceData}}}

Analysis Request:
{{{query}}}`,
});

const analyzeAttendanceDataFlow = ai.defineFlow(
  {
    name: 'analyzeAttendanceDataFlow',
    inputSchema: AnalyzeAttendanceDataInputSchema,
    outputSchema: AnalyzeAttendanceDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
