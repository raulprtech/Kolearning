import { ai } from '../genkit';
import { z } from 'genkit';
import { createClient } from '@/lib/supabase/client';

/**
 * Tool to store rewards/penalties based on student feedback.
 * Inspired by OpenClaw-RL (Binary RL / GRPO).
 */
export const storeInteractionRewardTool = ai.defineTool(
    {
        name: 'storeInteractionReward',
        description: 'Records feedback (positive or negative) about a specific pedagogical strategy to improve future responses.',
        inputSchema: z.object({
            userId: z.string().describe("The UUID of the student"),
            strategy: z.string().describe("The strategy used (e.g., 'Socratic Method', 'Direct Explanation', 'Visual Analogy')"),
            reward: z.number().min(-1).max(1).describe("Reward signal: 1 for success, -1 for failure/correction"),
            context: z.string().describe("Brief context of why this reward was given")
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string()
        }),
    },
    async ({ userId, strategy, reward, context }) => {
        console.log(`[RLSF] Storing reward ${reward} for strategy: ${strategy}`);
        const supabase = createClient();

        try {
            // 1. Get current profile to update the cognitive "Golden Rules"
            const { data: profile, error: getError } = await supabase
                .from('profiles')
                .select('additional_info')
                .eq('id', userId)
                .single();

            if (getError) throw getError;

            let info = {};
            if (profile.additional_info) {
                try {
                    info = JSON.parse(profile.additional_info);
                } catch (e) {
                    info = {};
                }
            }

            const cognitiveLayer = (info as any).cognitive_layer || {};
            const goldenRules = cognitiveLayer.golden_rules || [];

            // If it's a negative reward, it's a candidate for a "Negative Golden Rule" (What NOT to do)
            if (reward < 0) {
                goldenRules.push({
                    rule: `Avoid ${strategy} when ${context}`,
                    type: 'negative',
                    timestamp: new Date().toISOString()
                });
            } else {
                goldenRules.push({
                    rule: `Student prefers ${strategy} for ${context}`,
                    type: 'positive',
                    timestamp: new Date().toISOString()
                });
            }

            // Keep only the last 5 rules to keep prompt clean
            if (goldenRules.length > 5) goldenRules.shift();

            const updatedInfo = {
                ...info,
                cognitive_layer: {
                    ...cognitiveLayer,
                    golden_rules: goldenRules
                }
            };

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ additional_info: JSON.stringify(updatedInfo) })
                .eq('id', userId);

            if (updateError) throw updateError;

            return { success: true, message: "Feedback loop updated successfully." };
        } catch (error) {
            console.error("[RLSF] Error:", error);
            return { success: false, message: String(error) };
        }
    }
);
