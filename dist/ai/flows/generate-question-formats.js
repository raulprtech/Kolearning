'use server';
/**
 * @fileOverview Generates multiple question formats from concepts.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const GenerateQuestionFormatsInputSchema = z.object({
    concepts: z.array(z.object({
        concept: z.string(),
        definition: z.string(),
        importance: z.string(),
        category: z.string(),
        relatedConcepts: z.array(z.string()),
    })).describe('Concepts to convert into questions'),
});
const QuestionSchema = z.object({
    id: z.string().describe('Unique identifier for the question'),
    type: z.enum(['multiple_choice', 'true_false', 'ordering', 'association', 'open_ended', 'fill_blank']).describe('Question format type'),
    question: z.string().describe('The question text'),
    correctAnswer: z.string().describe('The correct answer'),
    incorrectAnswers: z.array(z.string()).optional().describe('Incorrect answer options (for multiple choice)'),
    explanation: z.string().describe('Explanation of why the answer is correct'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('Question difficulty level'),
    conceptId: z.string().describe('Reference to the source concept'),
});
const GenerateQuestionFormatsOutputSchema = z.object({
    questions: z.array(QuestionSchema).describe('Generated questions in various formats'),
    stats: z.object({
        totalQuestions: z.number(),
        byType: z.record(z.number()),
        byDifficulty: z.record(z.number()),
    }).describe('Statistics about generated questions'),
});
export const generateQuestionFormatsFlow = ai.defineFlow({
    name: 'generateQuestionFormatsFlow',
    inputSchema: GenerateQuestionFormatsInputSchema,
    outputSchema: GenerateQuestionFormatsOutputSchema,
}, async (input) => {
    const response = await ai.generate({
        messages: [
            {
                role: 'system',
                content: [
                    {
                        text: 'Eres un experto en diseño de evaluaciones educativas. Conviertes conceptos en preguntas de diferentes formatos: opción múltiple, verdadero/falso, ordenamiento, asociación, respuesta abierta y completar espacios. Cada pregunta debe ser pedagógicamente sólida y apropiada para el nivel educativo.'
                    }
                ]
            },
            {
                role: 'user',
                content: [
                    {
                        text: `Genera preguntas en múltiples formatos basadas en estos conceptos:

${JSON.stringify(input.concepts, null, 2)}

Para cada concepto importante, crea 1-3 preguntas usando diferentes formatos:

1. OPCIÓN MÚLTIPLE: Una pregunta con 4 opciones, solo una correcta
2. VERDADERO/FALSO: Afirmaciones que pueden ser verdaderas o falsas
3. ORDENAMIENTO: Secuencias, procesos o jerarquías a ordenar
4. ASOCIACIÓN: Conectar términos con definiciones o categorías
5. RESPUESTA ABIERTA: Preguntas que requieren explicación o análisis
6. COMPLETAR ESPACIOS: Frases con palabras clave faltantes

Considera:
- La importancia del concepto para determinar cuántas preguntas crear
- La categoría del concepto para elegir el formato más apropiado
- La dificultad apropiada según el nivel educativo
- Distractores plausibles para opción múltiple
- Explicaciones claras para cada respuesta correcta

Genera un ID único para cada pregunta (ej: "concept-1-mc", "concept-2-tf")`
                    }
                ]
            }
        ],
        model: 'googleai/gemini-2.5-flash-lite',
        output: {
            schema: GenerateQuestionFormatsOutputSchema,
            format: 'json'
        },
        config: {
            temperature: 0.2,
            maxOutputTokens: 16384
        },
    });
    if (!(response === null || response === void 0 ? void 0 : response.output)) {
        throw new Error('Failed to generate question formats.');
    }
    return response.output;
});
export async function generateQuestionFormats(input) {
    return generateQuestionFormatsFlow(input);
}
