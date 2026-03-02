import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { initializeServerConectores } from '@/infrastructure/connectors/index.server';
import { ConectorService } from '@/infrastructure/services/ConectorService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Aseguramos que esté inicializado si se requiere el QR
    const userId = 'user-123';
    const conectorService = new ConectorService();
    const userConectores = await conectorService.getUserConectores(userId);

    const enabledIds = userConectores.filter(c => c.isEnabled).map(c => c.conectorId);
    if (enabledIds.includes('whatsapp_sync')) {
        initializeServerConectores(['whatsapp_sync']);
    }

    const qrPath = path.join(process.cwd(), '.whatsapp_auth', 'last_qr.png');

    if (!fs.existsSync(qrPath)) {
        return new NextResponse(null, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(qrPath);

    return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}
