"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Downloads a PDF from a URL and stores it in Supabase Storage.
 */
export async function downloadAndStorePdf(url: string, fileName: string): Promise<string | null> {
    if (!url) return null;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to download PDF");

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const supabase = await createClient();

        // Sanitize filename
        const sanitizedFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + "_" + Date.now() + ".pdf";
        const bucketName = 'source-documents'; // Ensure this bucket exists

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(`papers/${sanitizedFileName}`, buffer, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (error) {
            console.error("Supabase Storage error:", error);
            // Fallback: If bucket doesn't exist or error, just return the original URL for now
            // so the user can still access it.
            return url;
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error("Error in downloadAndStorePdf:", error);
        return url; // Fallback to original URL
    }
}

/**
 * Uploads a local PDF file to Supabase Storage.
 */
export async function uploadLocalPdf(formData: FormData): Promise<string | null> {
    const file = formData.get('file') as File;
    if (!file) return null;

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const supabase = await createClient();

        const sanitizedFileName = file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + "_" + Date.now() + ".pdf";
        const bucketName = 'source-documents'; // Ensure this bucket exists

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(`papers/${sanitizedFileName}`, buffer, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (error) {
            console.error("Supabase Storage error:", error);
            return null;
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error("Error in uploadLocalPdf:", error);
        return null;
    }
}

/**
 * Fetches collections from Zotero API.
 */
export async function fetchZoteroCollections(userId: string, apiKey: string): Promise<any[]> {
    if (!userId || !apiKey) return [];

    try {
        const response = await fetch(
            `https://api.zotero.org/users/${userId}/collections?key=${apiKey}&format=json&limit=100`,
            { cache: 'no-store' }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Zotero API] Error fetching collections (${response.status}):`, errorText);
            throw new Error(`Zotero API error: ${response.statusText} - ${errorText}`);
        }

        const collections = await response.json();
        return collections.map((col: any) => ({
            id: col.key,
            name: col.data.name,
            numberOfItems: col.meta.numItems,
        }));
    } catch (error) {
        console.error("Error fetching Zotero collections:", error);
        throw error;
    }
}

/**
 * Fetches items from Zotero API, optionally filtered by a collection.
 */
export async function fetchZoteroLibrary(userId: string, apiKey: string, collectionId?: string): Promise<any[]> {
    if (!userId || !apiKey) return [];

    try {
        const url = collectionId
            ? `https://api.zotero.org/users/${userId}/collections/${collectionId}/items?key=${apiKey}&format=json&limit=50`
            : `https://api.zotero.org/users/${userId}/items?key=${apiKey}&format=json&limit=50`;

        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Zotero API] Error fetching library (${response.status}):`, errorText);
            throw new Error(`Zotero API error: ${response.statusText} - ${errorText}`);
        }

        const items = await response.json();
        const validTypes = new Set(['journalArticle', 'conferencePaper', 'report', 'book']);

        return items
            .filter((item: any) => validTypes.has(item.data.itemType))
            .map((item: any) => ({
                id: item.key, // Ensure we pass an ID for selection purposes
                title: item.data.title,
                authors: item.data.creators?.map((c: any) => `${c.firstName} ${c.lastName}`.trim()) || [],
                year: item.data.date ? new Date(item.data.date).getFullYear() : null,
                doi: item.data.DOI || null,
                venue: item.data.publicationTitle || item.data.proceedingsTitle || item.data.university || null,
                url: item.data.url || null,
                abstract: item.data.abstractNote || null,
            }));
    } catch (error) {
        console.error("Error fetching Zotero library:", error);
        throw error;
    }
}
