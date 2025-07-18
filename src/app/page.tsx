import { redirect } from 'next/navigation';

export default function Home() {
  // The middleware will redirect users to /dashboard
  redirect('/dashboard');
}
