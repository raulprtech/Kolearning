export interface IngestedDocument {
    title: string;
    authorOrSource: string;
    publishedYear?: number;
    url?: string;
    sourceType: 'paper' | 'video' | 'article' | 'book' | 'other';
    content: string; // The raw or Markdown content to be analyzed
    metadata?: Record<string, any>; // Extra info like DOI, tags, venue, etc.
}

export interface IIngestionAdapter {
    /**
     * Identifies if this adapter can handle the given input (URL, DOI, BibTeX, etc)
     */
    canHandle(input: string, file?: File): boolean;

    /**
     * Ingests the material and returns a generic IngestedDocument ready for AI processing
     */
    ingest(input: string, file?: File): Promise<IngestedDocument>;
}
