import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { startFlowsServer } from '@genkit-ai/flow';
import * as flows from './flows'; // Import all flows

console.log('=== STARTING GENKIT SERVER ===');
console.log('Available flows:', Object.keys(flows));

genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
});

console.log('=== STARTING FLOWS SERVER ===');
startFlowsServer();
console.log('=== FLOWS SERVER STARTED ===');
