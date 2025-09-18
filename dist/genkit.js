import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// Initialize Genkit with the same configuration as the server
export const ai = genkit({
    plugins: [
        googleAI({
            apiVersion: 'v1beta',
        }),
    ],
});
