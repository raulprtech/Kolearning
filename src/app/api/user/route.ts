import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * API route for retrieving and creating user documents in Firestore.
 *
 * GET: Verifies the idToken stored in the __session cookie and returns the
 * user's Firestore document. If the token is invalid or the user is not found,
 * appropriate error responses are returned.
 *
 * POST: Accepts a JSON body with uid, email, name, and displayName. It derives
 * a username from the provided name, displayName, or the local part of the
 * email. If the user does not exist, a new document is created with default
 * values for energy, coins, dominion points, etc. Missing uid or email
 * results in a 400 error.
 */
export async function GET(req: NextRequest) {
  try {
    const idToken = cookies().get('__session')?.value;
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'No session cookie' }, { status: 401 });
    }
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (err) {
      console.warn('Warning: failed to verify idToken in user GET route:', err);
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    const uid = decodedToken.uid;
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: userDoc.data() }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, name, displayName } = body;
    // Derive a username from provided fields. Fall back to email local part if needed.
    const userName = name ?? displayName ?? (email ? email.split('@')[0] : '');
    if (!uid || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return NextResponse.json({ success: true, data: userDoc.data() }, { status: 200 });
    }
    const newUser = {
      uid,
      email,
      name: userName,
      energy: 100,
      coins: 0,
      dominionPoints: 0,
      weeklyActivity: [],
      tutorSession: null,
      lastEnergyUpdate: Timestamp.now(),
      createdAt: Timestamp.now(),
    };
    await userRef.set(newUser);
    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}
