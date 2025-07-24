'use server';

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

export async function createSession(idToken: string) {
  const expiresInMs = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
  const maxAgeSec = expiresInMs / 1000;
  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: expiresInMs });
    const expires = new Date(Date.now() + expiresInMs);
    cookies().set('__session', sessionCookie, {
      maxAge: maxAgeSec,
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: 'Failed to create session.' };
  }
}

export async function createUserInFirestore(uid: string, email: string, displayName: string | null) {
  const userRef = adminDb.collection('users').doc(uid);
  const userDoc = await userRef.get();
  // Only create the document if it doesn't already exist
  if (!userDoc.exists) {
    try {
      await userRef.set({
        email,
        displayName: displayName || email.split('@')[0],
        createdAt: Timestamp.now(),
        lastSessionAt: Timestamp.now(),
        currentStreak: 0,
        coins: 180, // Starting coins
        energy: 10, // Starting energy
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

export async function getAuthSession(): Promise<DecodedIdToken | null> {
  const cookieStore = cookies();
  const session = cookieStore.get('__session')?.value;
  if (!session) return null;

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    return decodedClaims;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}
