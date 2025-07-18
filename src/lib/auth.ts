import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth } from './firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function getAuthSession() {
  return {
    uid: 'mock-user-id',
    email: 'test@example.com',
    name: 'Test User',
    picture: '',
    iat: 0,
    exp: 0,
    auth_time: 0,
    firebase: { identities: {}, sign_in_provider: '' },
  };
}
