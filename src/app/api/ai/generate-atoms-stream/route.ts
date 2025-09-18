import { NextRequest } from 'next/server';
import { generateAtomsFromLargeContentWithProgress } from '@/ai/flows/generate-atoms';

export const maxDuration = 300; // 5 minutes for large documents
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { studyMaterial, userPreferences } = body;

        // Default user preferences if not provided
        const defaultPreferences = {
          availableTimePerSession: 30,
          totalAvailableTime: 300,
          difficultyPreference: 'gradual' as const
        };

        // Progress callback to send real-time updates
        const onProgress = (progress: any) => {
          const chunk = encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            ...progress
          })}\n\n`);
          controller.enqueue(chunk);
        };

        // Generate atoms using the new 6-stage pipeline with progress updates
        const result = await generateAtomsFromLargeContentWithProgress(
          {
            studyMaterial,
            userPreferences: userPreferences || defaultPreferences
          },
          onProgress
        );

        // Send the complete result
        const chunk = encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          data: result
        })}\n\n`);
        controller.enqueue(chunk);

        // Send completion signal
        const doneChunk = encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        controller.enqueue(doneChunk);

        // Close the stream
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        const message = error instanceof Error ? (error.message || 'Generation failed') : 'Generation failed';
        // Avoid sending huge payloads (e.g., embedded base64) in error strings
        const concise = message.length > 500 ? message.slice(0, 500) + '…' : message;
        const errorChunk = encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: concise
        })}\n\n`);
        controller.enqueue(errorChunk);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}