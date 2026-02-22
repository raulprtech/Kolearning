import { NextResponse } from 'next/server';
import { UrlIngestionAdapter } from '@/adapters/ingestion/UrlIngestionAdapter';
import { PaperIngestionAdapter } from '@/adapters/ingestion/PaperIngestionAdapter';

// Here we inject multiple adapters based on a config or pattern match
const adapters = [new UrlIngestionAdapter(), new PaperIngestionAdapter()];

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const inputUrl = body.url;

        if (!inputUrl) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log(`[API v1/ingest] Received request to ingest: ${inputUrl}`);

        // Find the right adapter
        const adapter = adapters.find((a) => a.canHandle(inputUrl));

        if (!adapter) {
            console.warn(`[API v1/ingest] No suitable adapter found for: ${inputUrl}`);
            return NextResponse.json(
                { error: 'No suitable adapter found for this content type.' },
                { status: 400 }
            );
        }

        console.log(`[API v1/ingest] Using adapter: ${adapter.constructor.name}`);

        // Ingest the document
        const ingestedDocument = await adapter.ingest(inputUrl);

        // TODO: In Phase 21, this is where we would automatically trigger the AI to extract Atoms
        // and save it to the database for the user without them needing to open the web app.

        return NextResponse.json({
            success: true,
            message: 'Document ingested successfully',
            data: ingestedDocument,
        });

    } catch (error: any) {
        console.error('[API v1/ingest] Error during ingestion:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
