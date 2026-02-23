'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const ClassifyPaperSchema = z.object({
    fieldOfKnowledge: z.string().describe("The primary academic area or field (e.g., 'Quantum Computing', 'Molecular Biology', 'Macroeconomics')"),
    difficultyLevel: z.enum(['basic', 'intermediate', 'advanced']).describe("Estimated complexity for a learner"),
    paperType: z.enum(['survey', 'experimental', 'theoretical', 'review']).describe("Nature of the work"),
    tags: z.array(z.string()).describe("3-5 descriptive tags for categorization")
});
const ClassifyPaperInputSchema = z.object({
    title: z.string(),
    authors: z.array(z.string()).optional(),
    journalConference: z.string().optional(),
    year: z.number().optional(),
    abstract: z.string().optional(),
});
const classifyPaperPrompt = ai.definePrompt({
    name: 'classifyPaperPrompt',
    input: { schema: ClassifyPaperInputSchema },
    output: { schema: ClassifyPaperSchema },
    model: 'googleai/gemini-2.5-flash-lite',
    config: {
        temperature: 0.1,
        maxOutputTokens: 1024
    },
    prompt: `You are Koli, the Learning Box Academic Assistant. Your expertise is in academic research and paper classification.

**Your Objective:**
Classify the following scientific paper context to help the user organize their library.

PAPER DATA:
Title: {{title}}
Authors: {{#if authors}}{{authors}}{{else}}Unknown{{/if}}
Journal/Conference: {{#if journalConference}}{{journalConference}}{{else}}Unknown{{/if}}
Year: {{#if year}}{{year}}{{else}}Unknown{{/if}}
{{#if abstract}}
Abstract: {{abstract}}
{{/if}}

**INSTRUCTIONS:**
1. Determine the 'fieldOfKnowledge' (e.g., 'Artificial Intelligence', 'Solid State Physics').
2. Estimate the 'difficultyLevel' for a general student:
   - 'basic': Introductory material or general overviews.
   - 'intermediate': Requires some prior knowledge of the field.
   - 'advanced': Cutting-edge research, heavy mathematical or technical depth.
3. Identify the 'paperType':
   - 'survey': Broad overview of a field.
   - 'experimental': Presents new results from experiments/data.
   - 'theoretical': Focuses on models, proofs, and conceptual frameworks.
   - 'review': Synthesizes existing literature on a specific topic.
4. Provide search-friendly tags.

**GENERATE CLASSIFICATION:**`,
});
export const classifyPaper = ai.defineFlow({
    name: 'classifyPaper',
    inputSchema: ClassifyPaperInputSchema,
    outputSchema: ClassifyPaperSchema,
}, async (input) => {
    const { output } = await classifyPaperPrompt(input);
    return output;
});
