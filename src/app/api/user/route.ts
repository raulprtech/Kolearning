import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'No session cookie' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: userDoc.data() }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, name, displayName } = body;
    const userName = name || displayName;
    if (!uid || !email || !userName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return NextResponse.json({ success: true }, { status: 200 });
    }
    const now = Timestamp.now();
    await userRef.set({
      uid,
      email,
      name: userName,
      energy: 100,
      coins: 0,
      dominionPoints: 0,
      lastEnergyUpdate: now,
      weeklyActivity: Array(7).fill(0),
      createdAt: now,
      tutorSession: null,
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating user', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}
