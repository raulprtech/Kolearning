import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This is a placeholder route. The main logic is in generate-atoms-stream.
// This endpoint is deprecated and kept to avoid breaking changes if it's referenced somewhere.
export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'This endpoint is deprecated. Please use /api/ai/generate-atoms-stream.' }, { status: 410 });
}

