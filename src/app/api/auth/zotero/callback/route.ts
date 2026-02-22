import { NextRequest, NextResponse } from 'next/server';
import { generateNonce, getTimestamp, generateSignature, generateAuthHeader } from '@/lib/zotero-auth';
import { cookies } from 'next/headers';

/**
 * Handles the Zotero OAuth 1.0a callback.
 * Exchanges the temporary request token and verifier for a permanent access key.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');

    const clientKey = process.env.ZOTERO_CLIENT_KEY;
    const clientSecret = process.env.ZOTERO_CLIENT_SECRET;

    // Retrieve the temporary token secret stored during the login step
    const cookieStore = await cookies();
    const oauthTokenSecret = cookieStore.get('zotero_auth_secret')?.value;

    if (!oauthToken || !oauthVerifier || !oauthTokenSecret || !clientKey || !clientSecret) {
      console.error("[Zotero Auth] Missing OAuth parameters or session secret");
      return NextResponse.json({
        error: "Authentication failed",
        details: "Missing session data or OAuth parameters. Please try logging in again."
      }, { status: 400 });
    }

    const method = 'POST';
    const url = 'https://www.zotero.org/oauth/access';

    const params = {
      oauth_consumer_key: clientKey,
      oauth_nonce: generateNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: getTimestamp(),
      oauth_token: oauthToken,
      oauth_verifier: oauthVerifier,
      oauth_version: '1.0'
    };

    // Generate the HMAC-SHA1 signature for the access token exchange
    const signature = generateSignature(method, url, params, clientSecret, oauthTokenSecret);
    const authHeader = generateAuthHeader({ ...params, oauth_signature: signature });

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[Zotero Auth] Access token exchange failed:", text);
      return NextResponse.json({
        error: "Failed to connect with Zotero",
        details: text
      }, { status: response.status });
    }

    const data = await response.text();
    const result = Object.fromEntries(new URLSearchParams(data));

    const { userID, username, oauth_token_secret: apiKey } = result;

    if (!apiKey || !userID) {
      console.error("[Zotero Auth] Invalid response structure from Zotero:", result);
      return NextResponse.json({ error: "Invalid response from Zotero API" }, { status: 500 });
    }

    // Return a script to pass the credentials back to the opener window and close the popup
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Autenticación Exitosa</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff7ed;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <h1 style="color: #ea580c; margin-bottom: 0.5rem;">¡Conectado!</h1>
            <p style="color: #4b5563;">Ya puedes cerrar esta ventana.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'ZOTERO_AUTH_SUCCESS',
                  data: {
                    apiKey: '${apiKey}',
                    userID: '${userID}',
                    username: '${username || ""}'
                  }
                }, window.location.origin);
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error("[Zotero Auth] Unexpected error in callback:", error);
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "An unexpected error occurred during Zotero authentication."
    }, { status: 500 });
  }
}
