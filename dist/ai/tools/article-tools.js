import { ai } from '../genkit';
import { z } from 'genkit';
import { searchPapers } from '@/lib/paper-utils';
/**
 * searchArticlesTool: Searches for academic articles and papers based on a query.
 */
export const searchArticlesTool = ai.defineTool({
    name: 'searchArticles',
    description: 'Searches for academic articles and papers based on a query.',
    inputSchema: z.object({ query: z.string().describe("Topic or keyword to search for") }),
    outputSchema: z.array(z.object({
        title: z.string(),
        authors: z.array(z.string()).optional(),
        year: z.number().optional(),
        url: z.string().optional(),
        abstract: z.string().optional(),
    })),
}, async ({ query }) => {
    console.log(`[AI Orchestrator] Searching for articles: ${query}`);
    try {
        const results = await searchPapers(query);
        return results.map(r => ({
            title: r.title,
            authors: r.authors,
            year: r.year || undefined,
            url: r.url || undefined,
            abstract: r.abstract || undefined
        }));
    }
    catch (error) {
        console.error("[searchArticlesTool] Error:", error);
        return [];
    }
});
