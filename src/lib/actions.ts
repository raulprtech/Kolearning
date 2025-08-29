
'use server';

/**
 * Extracts the main textual content from a given URL.
 * It fetches the HTML, then tries to parse it to find the most relevant content,
 * stripping away boilerplate like navbars, footers, and scripts.
 * @param url The URL to extract content from.
 * @returns The cleaned text content of the article, or null if it fails.
 */
export async function extractContentFromUrl(url: string): Promise<string | null> {
    try {
        // We are using a proxy to bypass CORS issues.
        // This is suitable for a demo but a more robust solution might need a dedicated backend scraper.
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            console.error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
            return null;
        }

        const html = await response.text();

        // Remove scripts, styles, and SVGs first to clean up the content.
        let cleanHtml = html
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            .replace(/<style[^>]*>.*?<\/style>/gis, '')
            .replace(/<svg[^>]*>.*?<\/svg>/gis, '');

        // Use regex to find the main content if article or main tags are present.
        const articleMatch = /<article[^>]*>(.*?)<\/article>/is.exec(cleanHtml);
        const mainMatch = /<main[^>]*>(.*?)<\/main>/is.exec(cleanHtml);

        let contentToParse = cleanHtml;
        if (articleMatch && articleMatch[1]) {
            contentToParse = articleMatch[1];
        } else if (mainMatch && mainMatch[1]) {
            contentToParse = mainMatch[1];
        }
        
        // Convert all block-level tags to newlines to preserve paragraph structure.
        const withNewlines = contentToParse
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n')
            .replace(/<\/div>/gi, '\n');

        // Remove all remaining HTML tags.
        const textOnly = withNewlines.replace(/<[^>]+>/g, ' ');

        // Normalize whitespace: replace multiple spaces/newlines with a single space or newline.
        const normalizedText = textOnly
            .replace(/(\s*\n\s*){3,}/g, '\n\n') // Collapse multiple newlines into max two
            .replace(/[ \t]+/g, ' ')            // Collapse multiple spaces/tabs into one
            .replace(/^\s+|\s+$/g, '')          // Trim leading/trailing whitespace
            .trim();

        if (normalizedText.length < 100) {
            console.warn("Extracted content is very short. Might be an error page or a site structure we can't parse.");
            return null;
        }

        return normalizedText;
    } catch (error) {
        console.error('Error fetching or parsing URL content:', error);
        return null;
    }
}
