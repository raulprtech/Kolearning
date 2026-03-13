import { ai } from '@/ai/genkit';

/**
 * generateEmbedding: Utilizes Google Gemini to generate a vector representation of text.
 * @param text The input string to embed.
 * @returns A promise that resolves to an array of numbers (embedding).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const result = await ai.embed({
            embedder: 'googleai/text-embedding-004',
            content: text,
        });
        // Genkit returns an array of results for Batch, but for single it also returns an array usually
        if (Array.isArray(result) && result.length > 0) {
            return result[0].embedding;
        }
        return (result as any).embedding || result;
    } catch (error) {
        console.error('[EmbeddingUtils] Error generating embedding:', error);
        throw error;
    }
}
