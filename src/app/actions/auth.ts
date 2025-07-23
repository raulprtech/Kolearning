'use server';

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

export async function createSession(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    cookies().set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });
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
                coins: 100, // Starting coins
                energy: 10,  // Starting energy
                dominionPoints: 0,
                rank: 'G',
                lastSessionCompletedAt: null,
                weeklyActivity: [false, false, false, false, false, false, false],
            });
            return { success: true, isNew: true };
        } catch (error) {
            console.error('Error creating user in Firestore:', error);
            return { success: false, error: 'Failed to create user data.' };
        }
    }
    return { success: true, isNew: false };
}


export async function signOut() {
  cookies().delete('__session');
}

export async function getAuthSession(): Promise<DecodedIdToken | null> {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return null;
  }
  try {
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedIdToken;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}
