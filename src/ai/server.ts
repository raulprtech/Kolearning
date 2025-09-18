import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { startFlowsServer } from '@genkit-ai/flow';
import * as flows from './flows'; // Import all flows

genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
});

startFlowsServer();
// Force restart to register new flows
