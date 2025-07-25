// src/app/(main)/page.tsx

import { getAuthSession } from '@/app/actions/auth';
import { LoggedInDashboard } from '@/components/auth/LoggedInDashboard';
import { LandingPage } from '@/components/auth/LandingPage';

export default async function DashboardOrLandingPage() {
  const session = await getAuthSession();

  if (session) {
    return <LoggedInDashboard />;
  }

  return <LandingPage />;
}