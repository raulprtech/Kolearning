'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InferProjectMetadataSchema = z.object({
  title: z.string().describe("A concise, descriptive title for the learning project based on the content (max 60 characters)"),
  description: z.string().describe("A brief description of what the project covers and what the learner will achieve (max 200 characters)"),
  categories: z.array(z.string()).describe("1-3 relevant academic categories that best describe the content (e.g., 'Science', 'Technology', 'Humanities', 'Art', 'Mathematics')"),
  mainTopics: z.array(z.string()).describe("3-5 main topics or concepts that the content covers")
});

export type InferProjectMetadataOutput = z.infer<typeof InferProjectMetadataSchema>;

const InferProjectMetadataInputSchema = z.object({
  contentSummary: z.string().describe('A summary of all the content/atoms extracted from uploaded files'),
  fileNames: z.array(z.string()).optional().describe('Names of the uploaded files'),
});

type InferProjectMetadataInput = z.infer<typeof InferProjectMetadataInputSchema>;

export async function inferProjectMetadata(input: InferProjectMetadataInput): Promise<InferProjectMetadataOutput> {
  return inferProjectMetadataFlow(input);
}

const inferProjectMetadataPrompt = ai.definePrompt({
  name: 'inferProjectMetadataPrompt',
  input: { schema: InferProjectMetadataInputSchema },
  output: { schema: InferProjectMetadataSchema },
  model: 'googleai/gemini-2.5-flash-lite',
  config: {
    temperature: 0.1,
    maxOutputTokens: 8192
  },
  prompt: `You are the Kolearning Tutor, an AI tutor specializing in educational content analysis.
All your responses must be in English.

**Your Mission:**
Analyze the provided educational content and generate appropriate metadata for a learning project.

CONTENT TO ANALYZE:
{{contentSummary}}

PROVIDED FILES:
{{#if fileNames}}
{{#each fileNames}}
- {{this}}
{{/each}}
{{else}}
(No specific files)
{{/if}}

**INSTRUCTIONS:**
- Create a concise and descriptive title that captures the essence of the content (max 60 characters).
- Write a clear description of what the student will learn (max 200 characters).
- Select 1-3 relevant academic categories in English.
- Identify 3-5 main topics covered.
- Everything must be in English.
- The title should be specific yet accessible.
- The description should be motivating and clear about learning objectives.

**GOOD FORMAT EXAMPLES:**
Title: "Foundations of Quantum Physics"
Description: "Master the basic concepts of quantum mechanics, from wave-particle duality to the uncertainty principle."
Categories: ["Science", "Physics"]

Title: "Python Programming for Beginners"  
Description: "Learn to program from scratch with Python, covering variables, control structures, and object-oriented programming."
Categories: ["Technology", "Programming"]

**GENERATE THE METADATA:**`,
});

const inferProjectMetadataFlow = ai.defineFlow({
  name: 'inferProjectMetadata',
  inputSchema: InferProjectMetadataInputSchema,
  outputSchema: InferProjectMetadataSchema,
}, async (input) => {
  const { output } = await inferProjectMetadataPrompt(input);
  return output!;
});