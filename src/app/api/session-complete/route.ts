import { NextResponse } from 'next/server';

export async function POST() {
  console.log('Session complete endpoint hit (auth disabled).');
  return NextResponse.json({ success: true, newStreak: 1 });
}
