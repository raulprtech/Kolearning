'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InferProjectMetadataSchema = z.object({
  title: z.string().describe("A concise, descriptive title for the learning project based on the content (max 60 characters)"),
  description: z.string().describe("A brief description of what the project covers and what the learner will achieve (max 200 characters)"),
  categories: z.array(z.string()).describe("1-3 relevant academic categories that best describe the content (e.g., 'Ciencia', 'Tecnología', 'Humanidades', 'Arte', 'Matemáticas')"),
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
  prompt: `Eres Koli, un tutor de IA especializado en análisis de contenido educativo.
Todas tus respuestas deben estar en español.

**Tu misión:**
Analizar el contenido educativo proporcionado y generar metadatos apropiados para un proyecto de aprendizaje.

CONTENIDO A ANALIZAR:
{{contentSummary}}

ARCHIVOS PROPORCIONADOS:
{{#if fileNames}}
{{#each fileNames}}
- {{this}}
{{/each}}
{{else}}
(Sin archivos específicos)
{{/if}}

**INSTRUCCIONES:**
- Crea un título conciso y descriptivo que capture la esencia del contenido (máximo 60 caracteres)
- Escribe una descripción clara de qué aprenderá el estudiante (máximo 200 caracteres)
- Selecciona 1-3 categorías académicas relevantes en español
- Identifica 3-5 temas principales que se cubren
- Todo debe estar en español
- El título debe ser específico pero accesible
- La descripción debe ser motivadora y clara sobre los objetivos

**EJEMPLOS DE BUEN FORMATO:**
Título: "Fundamentos de Física Cuántica"
Descripción: "Domina los conceptos básicos de mecánica cuántica, desde dualidad onda-partícula hasta el principio de incertidumbre."
Categorías: ["Ciencia", "Física"]

Título: "Programación en Python para Principiantes"  
Descripción: "Aprende a programar desde cero con Python, cubriendo variables, estructuras de control y programación orientada a objetos."
Categorías: ["Tecnología", "Programación"]

**GENERA LOS METADATOS:**`,
});

const inferProjectMetadataFlow = ai.defineFlow({
  name: 'inferProjectMetadata',
  inputSchema: InferProjectMetadataInputSchema,
  outputSchema: InferProjectMetadataSchema,
}, async (input) => {
  const { output } = await inferProjectMetadataPrompt(input);
  return output!;
});