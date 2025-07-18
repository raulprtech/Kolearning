import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { differenceInCalendarDays } from 'date-fns';

export async function POST() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRef = adminDb.collection('users').doc(session.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const lastSessionAt = (userData?.lastSessionAt as Timestamp).toDate();
    const now = new Date();

    const daysDiff = differenceInCalendarDays(now, lastSessionAt);

    let newStreak = userData?.currentStreak || 0;

    if (daysDiff === 1) {
      // Last session was yesterday, increment streak
      newStreak++;
    } else if (daysDiff > 1) {
      // Last session was before yesterday, reset streak to 1
      newStreak = 1;
    }
    // If daysDiff is 0, do nothing with the streak

    await userRef.update({
      lastSessionAt: Timestamp.fromDate(now),
      currentStreak: newStreak,
    });

    return NextResponse.json({ success: true, newStreak });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
