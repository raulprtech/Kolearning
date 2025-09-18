import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { startFlowsServer } from '@genkit-ai/flow';
genkit({
    plugins: [
        googleAI({
            apiVersion: 'v1beta',
        }),
    ],
});
startFlowsServer();
// Force restart to register new flows
