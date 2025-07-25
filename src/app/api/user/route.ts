import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET handler: returns user document for authenticated session
export async function GET(req: NextRequest) {
  try {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: userDoc.data() }, { status: 200 });
  } catch (error) {
    console.error('Error verifying session cookie or fetching user:', error);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}

// POST handler: creates user document if it does not exist
export async function POST(req: NextRequest) {
  try {
    const { uid, email, name } = await req.json();
    // Validate inputs
    if (!uid || !email || !name) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    // Check if user exists
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return NextResponse.json({ success: true }, { status: 200 });
    }
    const now = Timestamp.now();
    // Create user with default values
    await userRef.set({
      uid,
      email,
      name,
      energy: 100,
      coins: 0,
      dominionPoints: 0,
      lastEnergyUpdate: now,
      weeklyActivity: Array(7).fill(0),
      createdAt: now,
      tutorSession: []
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}
