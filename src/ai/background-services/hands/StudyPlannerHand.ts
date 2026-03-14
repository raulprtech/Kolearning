import { createClient } from '@/lib/supabase/client';

/**
 * StudyPlannerHand: Prepares the user's focus for the week.
 */
export async function studyPlannerHand(userId: string) {
    console.log(`[StudyPlannerHand] Analyzing progress for user ${userId}`);
    const supabase = createClient();

    // 1. Fetch user mastery across projects
    const { data: projects } = await supabase.from('projects').select('title, mastery').eq('user_id', userId);
    
    if (!projects || projects.length === 0) return;

    // 2. Identify the project with lowest mastery
    const priorityProject = projects.reduce((prev, curr) => (prev.mastery < curr.mastery) ? prev : curr);

    console.log(`[StudyPlannerHand] Identified priority: ${priorityProject.title} (${priorityProject.mastery}%)`);

    // 3. Store a "Proactive Insight" in the profile
    const { data: profile } = await supabase.from('profiles').select('additional_info').eq('id', userId).single();
    if (!profile) return;

    const info = JSON.parse(profile.additional_info);
    const cognitiveLayer = info.cognitive_layer || {};
    
    cognitiveLayer.proactive_insights = cognitiveLayer.proactive_insights || [];
    cognitiveLayer.proactive_insights.push({
        type: 'weekly_focus',
        project: priorityProject.title,
        message: `I've noticed your mastery in ${priorityProject.title} is at ${priorityProject.mastery}%. Shall we focus on this today?`,
        timestamp: new Date().toISOString()
    });

    // Keep only the latest insight
    if (cognitiveLayer.proactive_insights.length > 3) cognitiveLayer.proactive_insights.shift();

    await supabase.from('profiles').update({ 
        additional_info: JSON.stringify({ ...info, cognitive_layer: cognitiveLayer }) 
    }).eq('id', userId);

    console.log('[StudyPlannerHand] Weekly focus updated in profile.');
}
