'use server';
/**
 * @fileOverview Extracts educational concepts based on document context.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const ExtractContextualConceptsInputSchema = z.object({
    content: z.string().describe('Document content to analyze'),
    context: z.object({
        documentType: z.string(),
        subject: z.string(),
        academicLevel: z.string(),
        mainTopics: z.array(z.string()),
        relevantSections: z.array(z.string()),
        irrelevantSections: z.array(z.string()),
    }).describe('Document context from previous analysis'),
});
const ExtractContextualConceptsOutputSchema = z.object({
    concepts: z.array(z.object({
        concept: z.string().describe('The main concept or topic'),
        definition: z.string().describe('Clear definition or explanation'),
        importance: z.enum(['high', 'medium', 'low']).describe('Educational importance level'),
        category: z.enum(['definition', 'formula', 'process', 'fact', 'example', 'principle']).describe('Type of concept'),
        relatedConcepts: z.array(z.string()).describe('Related concepts mentioned in the same context'),
    })).describe('Educational concepts extracted from the content'),
});
export const extractContextualConceptsFlow = ai.defineFlow({
    name: 'extractContextualConceptsFlow',
    inputSchema: ExtractContextualConceptsInputSchema,
    outputSchema: ExtractContextualConceptsOutputSchema,
}, async (input) => {
    const { content, context } = input;
    const response = await ai.generate({
        messages: [
            {
                role: 'system',
                content: [
                    {
                        text: `Eres un experto en ${context.subject} que extrae conceptos educativos relevantes. Tu objetivo es identificar solo los conceptos importantes para el aprendizaje en este campo, ignorando información irrelevante como metadatos, referencias o secciones administrativas.`
                    }
                ]
            },
            {
                role: 'user',
                content: [
                    {
                        text: `Extrae los conceptos educativos relevantes de este contenido:

CONTEXTO DEL DOCUMENTO:
- Tipo: ${context.documentType}
- Materia: ${context.subject}
- Nivel: ${context.academicLevel}
- Temas principales: ${context.mainTopics.join(', ')}

SECCIONES RELEVANTES A CONSIDERAR: ${context.relevantSections.join(', ')}
SECCIONES A IGNORAR: ${context.irrelevantSections.join(', ')}

CONTENIDO A ANALIZAR:
${content}

Extrae únicamente conceptos educativos importantes relacionados con ${context.subject}. Ignora:
- Referencias bibliográficas
- Información de autores o publicación
- Metadatos del documento
- Secciones administrativas
- Información no educativa

Para cada concepto, determina:
1. El concepto principal
2. Su definición clara
3. Su importancia educativa (alta, media, baja)
4. Su categoría (definición, fórmula, proceso, hecho, ejemplo, principio)
5. Conceptos relacionados mencionados`
                    }
                ]
            }
        ],
        model: 'googleai/gemini-2.5-flash-lite',
        output: {
            schema: ExtractContextualConceptsOutputSchema,
            format: 'json'
        },
        config: {
            temperature: 0.1,
            maxOutputTokens: 8192
        },
    });
    if (!(response === null || response === void 0 ? void 0 : response.output)) {
        throw new Error('Failed to extract contextual concepts.');
    }
    return response.output;
});
export async function extractContextualConcepts(input) {
    return extractContextualConceptsFlow(input);
}
