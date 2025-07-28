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
 * POST: Accepts a JSON body with uid, email, and displayName. It creates a new
 * user document in Firestore if one does not already exist, with all the

 * necessary default fields for the application to function correctly.
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
    const { uid, email, displayName } = body;

    if (!uid || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields: uid and email' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // If user exists, update their display name if a new one is provided.
      const updateData: { [key: string]: any } = {};
      if (displayName && displayName !== userDoc.data()?.displayName) {
        updateData.displayName = displayName;
      }
      if (Object.keys(updateData).length > 0) {
        await userRef.update(updateData);
      }
      const updatedDoc = await userRef.get();
      return NextResponse.json({ success: true, data: updatedDoc.data() }, { status: 200 });
    }
    
    // If user does not exist, create them with the full, correct structure.
    const newUser = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      createdAt: Timestamp.now(),
      lastSessionAt: Timestamp.now(),
      currentStreak: 0,
      coins: 180,
      energy: 10,
      dominionPoints: 0,
      rank: "G",
      lastSessionCompletedAt: null,
      weeklyActivity: [false, false, false, false, false, false, false],
      tutorSession: { isActive: false, exchangesLeft: 0 },
    };

    await userRef.set(newUser);
    return NextResponse.json({ success: true, data: newUser }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/user:', error);
    return NextResponse.json({ success: false, error: 'Failed to create or retrieve user' }, { status: 500 });
  }
}
