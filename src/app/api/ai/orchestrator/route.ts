import { NextRequest } from 'next/server';
import { kolearningOrchestrator } from '@/ai/flows/kolearning-orchestrator';
import { ProjectDatabase } from '@/lib/supabase/database';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { HookRegistry } from '@/core/domain/services/HookRegistry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { chatHistory, userName, userId, assistantConfig, attachedFiles, conversationId, enabledConectores } = body;

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
                    const { output, stream } = await kolearningOrchestrator.stream({
                        chatHistory: chatHistory.map((m: any) => ({
                            role: m.role === 'assistant' ? 'model' : m.role,
                            content: m.content
                        })),
                        userName: userName || 'Student',
                        userId: userId,
                        assistantConfig: assistantConfig,
                        attachedFiles: attachedFiles,
                        enabledConectores: enabledConectores
                    });

                    // Forward status updates from the flow
                    for await (const chunk of stream) {
                        if (chunk.type === 'status') {
                            sendUpdate({ type: 'status', content: chunk.content });
                        }
                    }

                    // Once finished, send the final result
                    // Once finished, send the final result
                    const finalResult = await output;
                    sendUpdate({ type: 'result', ...finalResult });

                    // Trigger mirroring for connectors (e.g. WhatsApp)
                    if (finalResult.response) {
                        console.log('[API Orchestrator] 📤 Disparando hook on_assistant_message...');
                        try {
                            HookRegistry.doAction('on_assistant_message', {
                                message: finalResult.response,
                                userId: userId
                            });
                            console.log('[API Orchestrator] ✅ Hook on_assistant_message disparado.');
                        } catch (hookErr) {
                            console.error('[API Orchestrator] ❌ Error mirroring to WhatsApp:', hookErr);
                        }
                    }

                    // Save assistant message to DB if persistence is enabled
                    if (conversationId && finalResult.response) {
                        try {
                            const supabase = await createServerClient();
                            const db = new ProjectDatabase(supabase);
                            await db.saveMessage(conversationId, 'assistant', finalResult.response);
                        } catch (saveErr) {
                            console.error('[API Orchestrator] Error saving assistant message:', saveErr);
                        }
                    }

                    console.log('[API Orchestrator] 🏁 Cerrando controlador de stream.');
                    controller.close();
                } catch (error: any) {
                    console.error('[API Orchestrator Stream Error]:', error);
                    sendUpdate({ type: 'error', message: error.message });
                    console.log('[API Orchestrator] 🏁 Cerrando controlador de stream tras error.');
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
