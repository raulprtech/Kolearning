import { createClient } from '@/lib/supabase/client';
import { collectorHand } from './hands/CollectorHand';
import { studyPlannerHand } from './hands/StudyPlannerHand';

/**
 * Hand Scheduler: The main entry point for background services.
 * Designed to be triggered by a CRON job (e.g. GitHub Actions, Render Cron, etc.)
 */
export async function runBackgroundHands() {
    console.log('[HandScheduler] Starting all active hands...');
    
    // We can fetch all active users to run hands for each
    const supabase = createClient();
    const { data: users, error } = await supabase.from('profiles').select('id');

    if (error) {
        console.error('[HandScheduler] Error fetching users:', error);
        return;
    }

    for (const user of users || []) {
        console.log(`[HandScheduler] Running hands for internal user: ${user.id}`);
        
        // Run hands in parallel (or sequential depending on rate limits)
        await Promise.allSettled([
            collectorHand(user.id),
            studyPlannerHand(user.id)
        ]);
    }

    console.log('[HandScheduler] All hands finished.');
}

// If run directly via npx tsx
if (require.main === module) {
    runBackgroundHands().catch(console.error);
}
