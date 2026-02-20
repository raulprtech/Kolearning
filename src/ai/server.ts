import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { startFlowsServer } from '@genkit-ai/flow';
import * as flows from './flows'; // Import all flows

console.log('=== STARTING GENKIT SERVER ===');
console.log('Available flows:', Object.keys(flows));

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
console.log('[Genkit Server] API key found:', apiKey ? 'Yes' : 'No');

genkit({
  plugins: [
    googleAI({
      apiKey,
      apiVersion: 'v1beta',
    }),
  ],
});

console.log('=== STARTING FLOWS SERVER ===');
startFlowsServer();
console.log('=== FLOWS SERVER STARTED ===');
