import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { initializeServerConectores } from '@/infrastructure/connectors/index.server';
import { ConectorService } from '@/infrastructure/services/ConectorService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Para el MVP, usamos un ID de usuario fijo o lo obtenemos de la sesión si existiera
    const userId = 'user-123';
    const conectorService = new ConectorService();
    const userConectores = await conectorService.getUserConectores(userId);

    // Si el conector está en la lista de habilitados, nos aseguramos de que esté inicializado en el servidor
    const enabledIds = userConectores.filter(c => c.isEnabled).map(c => c.conectorId);
    if (enabledIds.includes('whatsapp_sync')) {
        initializeServerConectores(['whatsapp_sync']);
    }

    const authDir = path.join(process.cwd(), '.whatsapp_auth');
    const credsExist = fs.existsSync(path.join(authDir, 'creds.json'));
    const qrExist = fs.existsSync(path.join(authDir, 'last_qr.png'));

    return NextResponse.json({
        connected: credsExist && !qrExist,
        hasQr: qrExist,
        timestamp: Date.now()
    });
}
