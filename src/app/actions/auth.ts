'use server';

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

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

export async function createUserInFirestore(uid: string, email: string) {
    try {
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.set({
            email,
            createdAt: Timestamp.now(),
            lastSessionAt: Timestamp.now(),
            currentStreak: 0,
        });
        return { success: true };
    } catch (error) {
        console.error('Error creating user in Firestore:', error);
        return { success: false, error: 'Failed to create user data.' };
    }
}


export async function signOut() {
  cookies().delete('__session');
}
