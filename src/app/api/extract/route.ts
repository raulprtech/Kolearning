
import { NextRequest, NextResponse } from 'next/server';
import { extractContentFromUrl } from '@/ai/flows/extract-content-from-url';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const result = await extractContentFromUrl({ url });
    if (result && result.content) {
      return NextResponse.json({ content: result.content });
    } else {
      return NextResponse.json({ error: 'Failed to extract content from the URL.' }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error in /api/extract for URL: ${url}`, error);
    const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
