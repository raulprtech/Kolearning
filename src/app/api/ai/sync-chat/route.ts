import { NextRequest, NextResponse } from 'next/server';
import { kolearningOrchestrator } from '@/ai/flows/kolearning-orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, userName, userId } = body;

        if (!message || !userId) {
            return NextResponse.json({ error: 'Missing message or userId' }, { status: 400 });
        }

        // For simplicity in WA, we only send the current user message as a single-turn history
        // in a real app, we'd fetch previous history for this userId from DB.
        const chatHistory = [
            { role: 'user', content: message }
        ];

        // Call the orchestrator directly (not streaming)
        const result = await kolearningOrchestrator.run({
            chatHistory: chatHistory.map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : m.role,
                content: m.content
            })),
            userName: userName || 'Student',
            userId: userId
        }) as any;

        // result should contain the response property defined in KolearningOrchestratorOutputSchema
        return NextResponse.json({ response: result.response });


    } catch (error: any) {
        console.error('[Sync Chat Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
