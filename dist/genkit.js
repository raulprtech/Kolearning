import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// Support both env var names
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn('[Genkit] ⚠️ No Google AI API key found. Set GOOGLE_GENAI_API_KEY or GEMINI_API_KEY in .env');
}
// Initialize Genkit with the same configuration as the server
export const ai = genkit({
    plugins: [
        googleAI({
            apiKey,
            apiVersion: 'v1beta',
        }),
    ],
});
