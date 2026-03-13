import { ai } from '../genkit';
import { z } from 'genkit';
import { ProjectDatabase } from '@/lib/supabase/database';
import { generateEmbedding } from '@/lib/ai/embedding-utils';
export const searchDeepMemoryTool = ai.defineTool({
    name: 'searchDeepMemory',
    description: 'Searches across all project contents (atoms) using semantic similarity (vector search).',
    inputSchema: z.object({
        query: z.string().describe("Search keywords or concept"),
        userId: z.string().describe("The UUID of the student")
    }),
    outputSchema: z.array(z.object({
        question: z.string(),
        answer: z.string(),
        projectName: z.string(),
        projectId: z.string().optional(),
        similarity: z.number().optional()
    })),
}, async ({ query, userId }) => {
    console.log(`[DeepMemory] Semantic Search for: "${query}" for user: ${userId}`);
    const db = new ProjectDatabase();
    const supabase = db.getClient();
    try {
        // 1. Generate embedding for the query
        console.log('[DeepMemory] Generating embedding...');
        const vector = await generateEmbedding(query);
        // 2. Try Vector Search via RPC
        console.log('[DeepMemory] Executing RPC match_atoms...');
        const { data: vectorData, error: vectorError } = await supabase.rpc('match_atoms', {
            query_embedding: vector,
            match_threshold: 0.5,
            match_count: 5,
            user_id_param: userId
        });
        if (!vectorError && vectorData && vectorData.length > 0) {
            console.log(`[DeepMemory] Semantic match found ${vectorData.length} atoms.`);
            return vectorData.map((item) => ({
                question: item.question,
                answer: item.answer,
                projectName: item.project_title,
                projectId: item.project_id,
                similarity: item.similarity
            }));
        }
        console.warn('[DeepMemory] Semantic search returned no results or failed, falling back to keyword search.');
    }
    catch (err) {
        console.error('[DeepMemory] Semantic search failed:', err);
    }
    // Fallback: Keyword search
    const { data, error } = await supabase
        .from('atoms')
        .select('question, answer, project_id, projects(title)')
        .eq('projects.user_id', userId)
        .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
        .limit(5);
    if (error) {
        console.error("[DeepMemory] Keyword Fallback Error:", error);
        return [];
    }
    return (data || []).map((item) => {
        var _a;
        return ({
            question: item.question,
            answer: item.answer,
            projectName: ((_a = item.projects) === null || _a === void 0 ? void 0 : _a.title) || 'Unknown Project',
            projectId: item.project_id
        });
    });
});
