export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return new Response(
    `data: ${JSON.stringify({ type: 'test', message: 'Endpoint works' })}\n\n`,
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}