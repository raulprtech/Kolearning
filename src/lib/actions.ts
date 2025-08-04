
'use server';

import { YouTubeTranscript } from 'youtube-transcript';

export async function extractContentFromUrl(url: string): Promise<string | null> {
    try {
        // We are using a proxy to bypass CORS issues.
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        const html = await response.text();
        
        // This is a very basic way to extract text. 
        // A more sophisticated solution would use a library like Cheerio on the server-side.
        const textOnly = html.replace(/<style[^>]*>.*<\/style>/gs, '')
                             .replace(/<script[^>]*>.*<\/script>/gs, '')
                             .replace(/<[^>]+>/g, ' ')
                             .replace(/\s+/g, ' ')
                             .trim();

        return textOnly;
    } catch (error) {
        console.error('Error fetching or parsing URL content:', error);
        return null;
    }
}


export async function extractTranscriptFromYoutubeUrl(url: string): Promise<string | null> {
    try {
        const transcript = await YouTubeTranscript.fetchTranscript(url);
        if (!transcript) {
            return null;
        }
        return transcript.map(item => item.text).join(' ');
    } catch (error) {
        console.error('Error fetching or parsing YouTube transcript:', error);
        return null;
    }
}
