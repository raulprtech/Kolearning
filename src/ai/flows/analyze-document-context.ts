'use server';

/**
 * @fileOverview Analyzes document context to understand content type and relevant sections.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeDocumentContextInputSchema = z.object({
  title: z.string().describe('Document title or filename'),
  contentSample: z.string().describe('Sample of document content (first few pages or sections)'),
});
export type AnalyzeDocumentContextInput = z.infer<typeof AnalyzeDocumentContextInputSchema>;

const AnalyzeDocumentContextOutputSchema = z.object({
  documentType: z.enum(['academic_paper', 'textbook', 'manual', 'lecture_notes', 'article', 'other'])
    .describe('Type of educational document'),
  subject: z.string().describe('Main subject or field of study'),
  academicLevel: z.enum(['elementary', 'high_school', 'undergraduate', 'graduate', 'professional'])
    .describe('Academic level of the content'),
  mainTopics: z.array(z.string()).describe('Main topics covered in the document'),
  relevantSections: z.array(z.string()).describe('Types of sections that contain educational content'),
  irrelevantSections: z.array(z.string()).describe('Types of sections to ignore (references, metadata, etc.)'),
  contentStructure: z.object({
    hasChapters: z.boolean(),
    hasFormulas: z.boolean(),
    hasDefinitions: z.boolean(),
    hasExamples: z.boolean(),
    hasDiagrams: z.boolean(),
  }).describe('Structure and content type indicators'),
});
export type AnalyzeDocumentContextOutput = z.infer<typeof AnalyzeDocumentContextOutputSchema>;

export const analyzeDocumentContextFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentContextFlow',
    inputSchema: AnalyzeDocumentContextInputSchema,
    outputSchema: AnalyzeDocumentContextOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      messages: [
        {
          role: 'system',
          content: [
            {
              text: 'Eres un experto en análisis de documentos educativos. Analiza el contenido para identificar el tipo de documento, tema, nivel académico y estructura. Esto ayudará a extraer solo el contenido educativo relevante y evitar secciones irrelevantes.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              text: `Analiza este documento educativo:

TÍTULO: ${input.title}

MUESTRA DE CONTENIDO:
${input.contentSample}

Identifica:
1. Tipo de documento (paper académico, libro de texto, manual, notas de clase, etc.)
2. Tema principal y campo de estudio
3. Nivel académico apropiado
4. Temas principales que se abordan
5. Qué secciones contienen contenido educativo útil
6. Qué secciones deben ignorarse (referencias, bibliografías, metadatos, etc.)
7. Estructura del contenido (capítulos, fórmulas, definiciones, ejemplos, etc.)`
            }
          ]
        }
      ],
      model: 'googleai/gemini-2.5-flash-lite',
      output: {
        schema: AnalyzeDocumentContextOutputSchema,
        format: 'json'
      },
    });

    if (!response?.output) {
      throw new Error('Failed to analyze document context.');
    }

    return response.output;
  }
);

export async function analyzeDocumentContext(input: AnalyzeDocumentContextInput): Promise<AnalyzeDocumentContextOutput> {
  return analyzeDocumentContextFlow(input);
}