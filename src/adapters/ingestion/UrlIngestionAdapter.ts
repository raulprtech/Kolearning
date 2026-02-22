import { IIngestionAdapter, IngestedDocument } from '@/core/ports/inbound/IIngestionAdapter';
import * as cheerio from 'cheerio';

export class UrlIngestionAdapter implements IIngestionAdapter {

    canHandle(input: string): boolean {
        return /^https?:\/\//.test(input);
    }

    async ingest(input: string): Promise<IngestedDocument> {
        try {
            const resp = await fetch(input);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const html = await resp.text();
            const $ = cheerio.load(html);

            const title = $('title').text() || 'Unknown Title';

            // Basic heuristic to strip fluff from article body
            $('script, style, nav, footer, header').remove();
            const content = $('body').text().replace(/\s+/g, ' ').trim();

            return {
                title,
                authorOrSource: new URL(input).hostname,
                sourceType: 'article',
                url: input,
                content: content.substring(0, 15000), // Safety cap for LLM context
            };
        } catch (error) {
            console.error('URL Ingestion error:', error);
            throw new Error('Failed to ingest URL content');
        }
    }
}
