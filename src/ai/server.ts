import 'dotenv/config';
import { ai } from './genkit';
import { startFlowsServer } from '@genkit-ai/flow';
import * as flows from './flows'; // Import all flows
import './scheduler'; // Initialize scheduler

console.log('=== STARTING GENKIT SERVER ===');
console.log('Available flows:', Object.keys(flows));

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
console.log('[Genkit Server] API key found:', apiKey ? 'Yes' : 'No');

// The 'ai' instance is imported from genkit.ts and is already initialized.

console.log('=== STARTING FLOWS SERVER ===');
startFlowsServer();
console.log('=== FLOWS SERVER STARTED ===');

