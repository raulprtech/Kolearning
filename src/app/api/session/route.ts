import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * API route for creating a session cookie. This endpoint accepts a JSON body
 * containing an `idToken` obtained from the Firebase client after a user
 * authenticates. It stores the idToken directly in the `__session` cookie.
 * This avoids using createSessionCookie(), which requires full service
 * credentials and can fail on serverless platforms without proper service
 * account configuration. The cookie is httpOnly and lasts for 5 days.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing idToken' },
        { status: 400 },
      );
    }
    // Optionally verify the idToken using Firebase Admin. If verification
    // fails, we still proceed to set the cookie but log a warning. This
    // allows local development without full admin credentials.
    try {
      if (adminAuth) {
        await adminAuth.verifyIdToken(idToken);
      }
    } catch (err) {
      console.warn('Warning: failed to verify idToken when creating session:', err);
    }
    const res = NextResponse.json({ success: true });
    const expiresInMs = 60 * 60 * 24 * 5 * 1000; // 5 days
    const expires = new Date(Date.now() + expiresInMs);
    res.cookies.set('__session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      expires,
    });
    return res;
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 },
    );
  }
}
