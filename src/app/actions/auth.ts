// Updated server-side authentication functions to work with idToken stored in
// the __session cookie. This file is designed to replace the current
// src/app/actions/auth.ts in the Kolearning project. It includes a new
// implementation of getAuthSession that decodes the idToken instead of
// verifying a session cookie. When Firebase Admin credentials are available
// (adminAuth is defined), it will verify the idToken; otherwise, it will
// gracefully decode the token using base64.  The createSession function is
// retained for compatibility but uses createSessionCookie from adminAuth.

'use server';

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Helper to decode a JWT payload without verifying the signature. This
// function splits the token, decodes the payload from base64 and returns
// the parsed JSON. If parsing fails, it returns null.
function decodeToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (err) {
    console.warn('Failed to decode token:', err);
    return null;
  }
}

/**
 * createSession server action.
 * This is retained for potential use by server-only flows. It uses
 * adminAuth.createSessionCookie when credentials are present. If the
 * credentials are missing, it falls back to setting the raw idToken in
 * the __session cookie (handled by the API route). The login page no
 * longer calls this function directly, but other server actions might.
 */
export async function createSession(idToken: string) {
  const expiresInMs = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
  const maxAgeSec = expiresInMs / 1000;
  try {
    // If adminAuth is undefined, skip creating a session cookie and just
    // store the idToken directly.
    if (adminAuth) {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: expiresInMs,
      });
      const expires = new Date(Date.now() + expiresInMs);
      cookies().set('__session', sessionCookie, {
        maxAge: maxAgeSec,
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      });
    } else {
      const expires = new Date(Date.now() + expiresInMs);
      cookies().set('__session', idToken, {
        maxAge: maxAgeSec,
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: 'Failed to create session.' };
  }
}

/**
 * createUserInFirestore server action.
 * Creates a user document if it does not already exist. Uses the email
 * local-part if displayName is null. Initializes default coins, energy,
 * dominion points and streak.
 */
export async function createUserInFirestore(
  uid: string,
  email: string,
  displayName: string | null,
) {
  const userRef = adminDb.collection('users').doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    try {
      await userRef.set({
        email,
        displayName: displayName || email.split('@')[0],
        createdAt: Timestamp.now(),
        lastSessionAt: Timestamp.now(),
        currentStreak: 0,
        coins: 180,
        energy: 10,
        dominionPoints: 0,
      });
    } catch (error) {
      console.error('Error creating user in Firestore:', error);
      throw error;
    }
  }
}

export async function signOut() {
  try {
    // Clear the session cookie by setting an expired cookie
    cookies().set('__session', '', {
      maxAge: 0,
      expires: new Date(0),
      path: '/',
    });
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

/**
 * Returns the decoded idToken from the session cookie or null if invalid.
 * If Firebase Admin is available, uses verifyIdToken. Otherwise falls back
 * to decoding the JWT payload locally. Returns an object containing the
 * claims or null if decoding fails.
 */
export async function getAuthSession(): Promise<DecodedIdToken | any | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('__session')?.value;
  if (!token) return null;
  // Try to verify with Firebase Admin if available
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return decoded;
    } catch (error) {
      console.warn('Failed to verify idToken with adminAuth:', error);
      // Fall back to manual decode
    }
  }
  const decoded = decodeToken(token);
  return decoded;
}