import { NextRequest, NextResponse } from 'next/server';
import { generateNonce, getTimestamp, generateSignature, generateAuthHeader } from '@/lib/zotero-auth';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
    const clientKey = process.env.ZOTERO_CLIENT_KEY;
    const clientSecret = process.env.ZOTERO_CLIENT_SECRET;

    // Use current host for absolute callback URL
    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const callbackUrl = `${protocol}://${host}/api/auth/zotero/callback`;

    if (!clientKey || !clientSecret) {
        return NextResponse.json({ error: "Zotero Client Key or Secret missing in environment" }, { status: 500 });
    }

    const method = 'POST';
    const url = 'https://www.zotero.org/oauth/request';

    const params = {
        oauth_callback: callbackUrl,
        oauth_consumer_key: clientKey,
        oauth_nonce: generateNonce(),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: getTimestamp(),
        oauth_version: '1.0'
    };

    const signature = generateSignature(method, url, params, clientSecret);
    const authHeader = generateAuthHeader({ ...params, oauth_signature: signature });

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': authHeader
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Zotero request token error:", text);
            return NextResponse.json({ error: "Failed to get request token from Zotero" }, { status: response.status });
        }

        const data = await response.text();
        const result = Object.fromEntries(new URLSearchParams(data));

        const { oauth_token, oauth_token_secret } = result;

        if (!oauth_token || !oauth_token_secret) {
            return NextResponse.json({ error: "Invalid response from Zotero" }, { status: 500 });
        }

        // Store token secret in a secure cookie for the callback
        const cookieStore = await cookies();
        cookieStore.set('zotero_auth_secret', oauth_token_secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 600 // 10 minutes
        });

        // Redirect user to Zotero authorization page
        return NextResponse.redirect(`https://www.zotero.org/oauth/authorize?oauth_token=${oauth_token}`);
    } catch (error) {
        console.error("Error in Zotero login route:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
