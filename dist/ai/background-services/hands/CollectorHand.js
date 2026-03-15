import { createClient } from '@/lib/supabase/client';
/**
 * CollectorHand: Proactively searches for new knowledge based on user interests.
 * Inspired by OpenFANG's 'Collector' hand.
 */
export async function collectorHand(userId) {
    var _a;
    console.log(`[CollectorHand] Starting for user ${userId}`);
    const supabase = createClient();
    // 1. Get user interests from profile
    const { data: profile } = await supabase.from('profiles').select('additional_info').eq('id', userId).single();
    if (!(profile === null || profile === void 0 ? void 0 : profile.additional_info))
        return;
    const info = JSON.parse(profile.additional_info);
    const interests = ((_a = info.cognitive_layer) === null || _a === void 0 ? void 0 : _a.interests) || [];
    if (interests.length === 0) {
        console.log('[CollectorHand] No interests found, skipping.');
        return;
    }
    // Pick a random interest to research
    const targetInterest = interests[Math.floor(Math.random() * interests.length)].content;
    console.log(`[CollectorHand] Researching: ${targetInterest}`);
    // 2. Search for articles (PoC: we use the existing tool logic)
    // Note: In a real background service, we'd call the underlying API directly.
    // For this PoC, we simulate finding one and adding it to the 'Sources' table as "Suggested".
    const { error } = await supabase.from('sources').insert({
        user_id: userId,
        title: `Auto-Collected: New trends in ${targetInterest}`,
        url: 'https://arxiv.org/search/ai', // Placeholder
        type: 'url',
        content: `Hand collected this because you showed interest in ${targetInterest}.`
    });
    if (error)
        console.error('[CollectorHand] Error saving source:', error);
    else
        console.log(`[CollectorHand] Successfully added suggested source for ${targetInterest}`);
}
