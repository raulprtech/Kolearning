import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCwQ6yFSDhbD0OVjyUz3pfg4IwrJ_XawwE",
  authDomain: "fir-admin-spark.firebaseapp.com",
  databaseURL: "https://firebase-admin-spark-default-rtdb.firebaseio.com",
  projectId: "firebase-admin-spark",
  storageBucket: "firebase-admin-spark.firebasestorage.app",
  messagingSenderId: "704501328178",
  appId: "1:704501328178:web:f847f1917506703cde4f2b",
  measurementId: "G-B6NFZVGTPP"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };