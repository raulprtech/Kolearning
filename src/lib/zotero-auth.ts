import crypto from 'crypto';

/**
 * Utilities for Zotero OAuth 1.0a authentication.
 */

interface OAuthParams {
    oauth_consumer_key: string;
    oauth_nonce: string;
    oauth_signature_method: string;
    oauth_timestamp: string;
    oauth_version: string;
    oauth_token?: string;
    oauth_callback?: string;
    oauth_verifier?: string;
    [key: string]: any;
}

export function generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
}

export function getTimestamp(): string {
    return Math.floor(Date.now() / 1000).toString();
}

/**
 * Percent-encodes a string according to RFC 3986.
 */
export function rfc3986Encode(str: string): string {
    return encodeURIComponent(str)
        .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Generates the OAuth signature for a request.
 */
export function generateSignature(
    method: string,
    url: string,
    params: OAuthParams,
    consumerSecret: string,
    tokenSecret: string = ''
): string {
    // 1. Collect and sort parameters
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${rfc3986Encode(key)}=${rfc3986Encode(params[key])}`)
        .join('&');

    // 2. Create the signature base string
    const baseString = [
        method.toUpperCase(),
        rfc3986Encode(url.split('?')[0]), // Base URL without query params
        rfc3986Encode(sortedParams)
    ].join('&');

    // 3. Create the signing key
    const signingKey = [
        rfc3986Encode(consumerSecret),
        rfc3986Encode(tokenSecret)
    ].join('&');

    // 4. Calculate the HMAC-SHA1 signature
    const signature = crypto
        .createHmac('sha1', signingKey)
        .update(baseString)
        .digest('base64');

    return signature;
}

/**
 * Generates the Authorization header string.
 */
export function generateAuthHeader(params: OAuthParams): string {
    return 'OAuth ' + Object.keys(params)
        .filter(key => key.startsWith('oauth_'))
        .map(key => `${rfc3986Encode(key)}="${rfc3986Encode(params[key])}"`)
        .join(', ');
}
