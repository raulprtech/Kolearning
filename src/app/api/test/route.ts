import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test endpoint received:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      received: body
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}