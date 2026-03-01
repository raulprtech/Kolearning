import { NextRequest, NextResponse } from 'next/server';
import { initializeServerConectores } from '@/infrastructure/connectors/index.server';
import { ConectorManager } from '@/infrastructure/services/ConectorManager';

export const dynamic = 'force-dynamic';

/**
 * POST /api/connectors/initialize
 * 
 * Initializes server-only connectors (e.g., WhatsApp) on the Node.js server.
 * Called from the client when a user enables a server-only connector.
 * 
 * Body: { conectorIds: string[], action?: 'enable' | 'disable' }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { conectorIds, action = 'enable' } = body;

        if (!Array.isArray(conectorIds) || conectorIds.length === 0) {
            return NextResponse.json(
                { error: 'conectorIds must be a non-empty array' },
                { status: 400 }
            );
        }

        if (action === 'enable') {
            initializeServerConectores(conectorIds);
            return NextResponse.json({
                success: true,
                message: `Server connectors initialized: ${conectorIds.join(', ')}`
            });
        } else if (action === 'disable') {
            for (const id of conectorIds) {
                ConectorManager.unregisterConector(id);
            }
            return NextResponse.json({
                success: true,
                message: `Server connectors disabled: ${conectorIds.join(', ')}`
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('[API /connectors/initialize] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to initialize connectors' },
            { status: 500 }
        );
    }
}
