import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * API route for creating a session cookie. This endpoint accepts a JSON body
 * containing an `idToken` obtained from the Firebase client after a user
 * authenticates. It returns a JSON response with a `success` boolean and
 * sets the `__session` cookie on the response when successful. The cookie
 * uses the same configuration as the server action but is callable from the
 * client side via fetch().
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'Missing idToken' }, { status: 400 });
    }
    const expiresInMs = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: expiresInMs });
    const res = NextResponse.json({ success: true });
    const expires = new Date(Date.now() + expiresInMs);
    res.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      expires,
    });
    return res;
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 });
  }
}
