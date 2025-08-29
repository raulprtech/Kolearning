'use server';

/**
 * @fileOverview Extracts the main content from a given URL using an LLM.
 *
 * - extractContentFromUrl - A function that handles the content extraction process.
 * - ExtractContentInput - The input type for the extractContentFromUrl function.
 * - ExtractContentOutput - The return type for the extractContentFromUrl function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractContentInputSchema = z.object({
  url: z.string().describe('The URL from which to extract content.'),
});
export type ExtractContentInput = z.infer<typeof ExtractContentInputSchema>;

const ExtractContentOutputSchema = z.object({
  content: z
    .string()
    .describe('The main textual content extracted from the URL.'),
});
export type ExtractContentOutput = z.infer<
  typeof ExtractContentOutputSchema
>;

async function fetchHtmlFromUrl(url: string): Promise<string> {
    try {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching URL content:', error);
        throw new Error('Could not retrieve content from the provided URL.');
    }
}


export async function extractContentFromUrl(
  input: ExtractContentInput
): Promise<ExtractContentOutput> {
  return extractContentFlow(input);
}

const extractContentPrompt = ai.definePrompt({
  name: 'extractContentPrompt',
  input: { schema: z.object({ htmlContent: z.string() }) },
  output: { schema: ExtractContentOutputSchema },
  prompt: `You are an expert web content extractor. Your task is to analyze the provided HTML content and extract only the main article or the primary text content.

You MUST ignore all surrounding boilerplate, including but not limited to:
- Navigation bars, headers, and footers
- Advertisements and promotional materials
- Sidebars with related links or widgets
- Social media sharing buttons
- Comment sections

Return only the clean, readable, plain text of the main content. Do not include any HTML tags in your output.

HTML Content:
{{{htmlContent}}}
`,
});

const extractContentFlow = ai.defineFlow(
  {
    name: 'extractContentFlow',
    inputSchema: ExtractContentInputSchema,
    outputSchema: ExtractContentOutputSchema,
  },
  async ({ url }) => {
    const htmlContent = await fetchHtmlFromUrl(url);

    const { output } = await extractContentPrompt({ htmlContent });
    if (!output) {
        throw new Error("The AI model failed to extract content from the HTML.");
    }

    return output;
  }
);
