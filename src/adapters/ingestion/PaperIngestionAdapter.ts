import { IIngestionAdapter, IngestedDocument } from '@/core/ports/inbound/IIngestionAdapter';
import { searchPapers } from '@/lib/paper-utils';

export class PaperIngestionAdapter implements IIngestionAdapter {

    canHandle(input: string, _file?: File): boolean {
        // We can handle raw titles, DOIs, or arxiv URLs which denote papers
        const isDoi = /^10.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(input);
        const isArxiv = input.includes('arxiv.org');

        // For MVP, if it doesn't look like a standard HTTP URL (blog/news), we assume it's a paper title/DOI
        const isStandardUrl = /^https?:\/\//.test(input) && !isArxiv;

        return isDoi || isArxiv || !isStandardUrl;
    }

    async ingest(input: string, _file?: File): Promise<IngestedDocument> {
        try {
            console.log(`[PaperIngestionAdapter] Ingesting paper query: ${input}`);
            // Use existing semantic scholar utility
            const results = await searchPapers(input);

            if (!results || results.length === 0) {
                throw new Error('No paper found for this query');
            }

            // Take the most relevant result
            const paper = results[0];

            return {
                title: paper.title,
                authorOrSource: paper.authors.join(', ') || 'Unknown Authors',
                publishedYear: paper.year || undefined,
                sourceType: 'paper',
                url: paper.url || undefined,
                content: paper.abstract || 'No abstract available for this paper.', // Ideally we'd parse the full PDF here in the future
                metadata: {
                    doi: paper.doi,
                    venue: paper.venue,
                    pdfUrl: paper.pdfUrl
                }
            };

        } catch (error) {
            console.error('Paper Ingestion error:', error);
            throw new Error('Failed to ingest paper content');
        }
    }
}
