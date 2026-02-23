import { NextRequest } from 'next/server';
import { koliOrchestrator } from '@/ai/flows/koli-orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { chatHistory, userName, userId, assistantConfig } = body;

        if (!chatHistory || !Array.isArray(chatHistory)) {
            return new Response(JSON.stringify({ error: 'Missing or invalid chatHistory' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                const sendUpdate = (data: any) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    // Start the streaming flow
                    const { output, stream } = await koliOrchestrator.stream({
                        chatHistory: chatHistory.map((m: any) => ({
                            role: m.role === 'assistant' ? 'model' : m.role,
                            content: m.content
                        })),
                        userName: userName || 'Student',
                        userId: userId,
                        assistantConfig: assistantConfig
                    });

                    // Forward status updates from the flow
                    for await (const chunk of stream) {
                        if (chunk.type === 'status') {
                            sendUpdate({ type: 'status', content: chunk.content });
                        }
                    }

                    // Once finished, send the final result
                    const finalResult = await output;
                    sendUpdate({ type: 'result', ...finalResult });
                    controller.close();
                } catch (error: any) {
                    console.error('[API Orchestrator Stream Error]:', error);
                    sendUpdate({ type: 'error', message: error.message });
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('[API Orchestrator Error]:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
