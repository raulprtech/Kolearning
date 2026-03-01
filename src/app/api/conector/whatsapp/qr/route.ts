import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
