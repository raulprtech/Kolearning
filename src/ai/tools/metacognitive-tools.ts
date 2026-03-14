import { ai } from '../genkit';
import { z } from 'genkit';
import { createClient } from '@/lib/supabase/client';

export const updateStudentProfileTool = ai.defineTool(
    {
        name: 'updateStudentProfile',
        description: 'Updates the student cognitive profile with new observations about their learning style, preferences, or topics of interest.',
        inputSchema: z.object({
            userId: z.string().describe("The UUID of the student"),
            observation: z.string().describe("New fact or preference observed (e.g., 'Student prefers visual analogies for physics')"),
            category: z.enum(['preference', 'difficulty', 'interest', 'style']).describe("Category of the observation")
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string()
        }),
    },
    async ({ userId, observation, category }) => {
        console.log(`[Metacognition] Updating profile for user: ${userId}`);
        const supabase = createClient();

        try {
            // 1. Get current profile
            const { data: profile, error: getError } = await supabase
                .from('profiles')
                .select('additional_info')
                .eq('id', userId)
                .single();

            if (getError) throw getError;

            // 2. Parse and merge
            let info = {};
            if (profile.additional_info) {
                try {
                    info = JSON.parse(profile.additional_info);
                } catch (e) {
                    // Fallback if it's not JSON
                    info = { legacy_info: profile.additional_info };
                }
            }

            const cognitiveLayer = (info as any).cognitive_layer || { 
                preferences: [], 
                difficulties: [], 
                interests: [], 
                styles: [] 
            };

            // Add the new observation to the appropriate list
            const listKey = category === 'preference' ? 'preferences' : 
                            category === 'difficulty' ? 'difficulties' : 
                            category === 'interest' ? 'interests' : 'styles';
            
            cognitiveLayer[listKey].push({
                content: observation,
                timestamp: new Date().toISOString()
            });

            // Keep only the last 10 observations per category to avoid bloating
            if (cognitiveLayer[listKey].length > 10) {
                cognitiveLayer[listKey].shift();
            }

            const updatedInfo = {
                ...info,
                cognitive_layer: cognitiveLayer
            };

            // 3. Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    additional_info: JSON.stringify(updatedInfo),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            return {
                success: true,
                message: `Metacognitive observation added to category ${category}.`
            };
        } catch (error) {
            console.error("[Metacognition] Error:", error);
            return {
                success: false,
                message: `Failed to update profile: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
);

export const browseLearningBrainTool = ai.defineTool(
    {
        name: 'browseLearningBrain',
        description: 'Navigates the students knowledge hierarchy using a file-system paradigm (viking:// protocol). Efficiently loads context in tiers (L0: Overview, L1: Concept Map, L2: Details).',
        inputSchema: z.object({
            path: z.string().describe("The virtual path to browse. Examples: 'viking://projects' (L0), 'viking://projects/:id' (L1), 'viking://projects/:id/atoms/:atomId' (L2)"),
            userId: z.string().describe("The UUID of the student")
        }),
        outputSchema: z.object({
            currentLevel: z.enum(['L0', 'L1', 'L2']),
            data: z.any(),
            message: z.string().optional()
        }),
    },
    async ({ path, userId }) => {
        console.log(`[OpenViking] Browsing: ${path} for user: ${userId}`);
        const supabase = createClient();

        // 1. L0: Root - List all projects
        if (path === 'viking://projects' || path === 'viking://') {
            const { data, error } = await supabase
                .from('projects')
                .select('id, title, description, mastery')
                .eq('user_id', userId);
            
            if (error) throw error;
            return { currentLevel: 'L0' as const, data: data || [] };
        }

        // 2. L1: Project Level - Concept Map (List atoms without full answers)
        const projectMatch = path.match(/^viking:\/\/projects\/([^\/]+)$/);
        if (projectMatch) {
            const projectId = projectMatch[1];
            const { data: project } = await supabase.from('projects').select('title, description').eq('id', projectId).single();
            const { data: atoms, error } = await supabase
                .from('atoms')
                .select('id, question')
                .eq('project_id', projectId);
            
            if (error) throw error;
            return { 
                currentLevel: 'L1' as const, 
                data: { 
                    project, 
                    conceptMap: atoms?.map(a => ({ id: a.id, topic: a.question })) || [] 
                } 
            };
        }

        // 3. L2: Atom Level - Full Detail
        const atomMatch = path.match(/^viking:\/\/projects\/[^\/]+\/atoms\/([^\/]+)$/);
        if (atomMatch) {
            const atomId = atomMatch[1];
            const { data, error } = await supabase
                .from('atoms')
                .select('*')
                .eq('id', atomId)
                .single();
            
            if (error) throw error;
            return { currentLevel: 'L2' as const, data };
        }

        return { 
            currentLevel: 'L0' as const, 
            data: null, 
            message: "Invalid path. Use 'viking://projects' as root." 
        };
    }
);
