
import { NextRequest, NextResponse } from 'next/server';
import { extractContentFromUrl } from '@/lib/actions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const content = await extractContentFromUrl(url);
    if (content) {
      return NextResponse.json({ content });
    } else {
      return NextResponse.json({ error: 'Failed to extract content from the URL.' }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error in /api/extract for URL: ${url}`, error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
