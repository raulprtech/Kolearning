
import { Suspense } from 'react';
import { LoggedInDashboard } from '@/components/dashboard/LoggedInDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

function DashboardSkeleton() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
            <div className="space-y-4">
                 <Skeleton className="h-8 w-1/5" />
                 <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                 </div>
            </div>
        </div>
    )
}

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LoggedInDashboard />
    </Suspense>
  );
}
