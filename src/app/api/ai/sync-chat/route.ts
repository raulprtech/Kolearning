import { NextRequest, NextResponse } from 'next/server';
import { kolearningOrchestrator } from '@/ai/flows/kolearning-orchestrator';
import { ProjectDatabase } from '@/lib/supabase/database';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, userName, userId } = body;

        console.log(`[API Sync-Chat] 📥 Recibido de WA (${userId}): "${message}"`);

        if (!message || !userId) {
            console.warn('[API Sync-Chat] ⚠️ Faltan datos obligatorios.');
            return NextResponse.json({ error: 'Missing message or userId' }, { status: 400 });
        }

        // For WA, we try to find an existing conversation or create one
        const supabase = await createServerClient();
        const db = new ProjectDatabase(supabase);

        // 1. Find or create conversation for this WA user
        const conversations = await db.getConversations(userId);
        let activeConvId: string;

        if (conversations.length > 0) {
            activeConvId = conversations[0].id;
        } else {
            activeConvId = await db.createConversation(userId, `WhatsApp Chat: ${userName}`);
        }

        // 2. Save User Message
        await db.saveMessage(activeConvId, 'user', message);

        // 3. Call the orchestrator
        const result = await kolearningOrchestrator.run({
            chatHistory: [{ role: 'user', content: message }].map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : m.role,
                content: m.content
            })),
            userName: userName || 'Student',
            userId: userId
        }) as any;

        // 4. Save Assistant response
        if (result.response) {
            await db.saveMessage(activeConvId, 'assistant', result.response);
        }

        console.log(`[API Sync-Chat] ✅ Guardado y respondido.`);
        return NextResponse.json({ response: result.response });


    } catch (error: any) {
        console.error('[Sync Chat Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
