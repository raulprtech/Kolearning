import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authDir = path.join(process.cwd(), '.whatsapp_auth');
    const credsExist = fs.existsSync(path.join(authDir, 'creds.json'));
    const qrExist = fs.existsSync(path.join(authDir, 'last_qr.png'));

    return NextResponse.json({
        connected: credsExist && !qrExist,
        hasQr: qrExist,
        timestamp: Date.now()
    });
}
