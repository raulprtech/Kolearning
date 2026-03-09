import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { initializeServerConectores } from '@/infrastructure/connectors/index.server';
import { ConectorService } from '@/infrastructure/services/ConectorService';
import { ConectorManager } from '@/infrastructure/services/ConectorManager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'user-any';
        const conectorService = new ConectorService();
        const userConectores = await conectorService.getUserConectores(userId);

        const whatsappUserConfig = userConectores.find(c => c.conectorId === 'whatsapp_sync');
        const isEnabled = whatsappUserConfig?.isEnabled || false;

        console.log(`[API:WA:Status] User:${userId}, Enabled:${isEnabled}`);

        if (isEnabled) {
            try {
                await initializeServerConectores(['whatsapp_sync']);
            } catch (initErr) {
                console.error('[API:WA:Status] Init Error:', initErr);
                // No retornamos error aquí todavía, dejemos ver si el resto funciona
            }
        }

        const authDir = path.join(process.cwd(), '.whatsapp_auth');
        let credsExist = false;
        let qrExist = false;

        try {
            if (!fs.existsSync(authDir)) {
                fs.mkdirSync(authDir, { recursive: true });
            }
            credsExist = fs.existsSync(path.join(authDir, 'creds.json'));
            qrExist = fs.existsSync(path.join(authDir, 'last_qr.png'));
        } catch (fsErr) {
            console.error('[API:WA:Status] FS Error:', fsErr);
        }

        const isRunning = ConectorManager.isConectorActive('whatsapp_sync');

        return NextResponse.json({
            connected: credsExist && !qrExist,
            hasQr: qrExist,
            isEnabled,
            isRunning,
            timestamp: Date.now(),
            debug: {
                authDir,
                credsExist,
                qrExist,
                processCwd: process.cwd()
            }
        });
    } catch (error: any) {
        console.error('[API /conector/whatsapp/status] Critical Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error', stack: error.stack },
            { status: 500 }
        );
    }
}
