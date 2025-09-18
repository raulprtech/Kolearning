'use server';
/**
 * @fileOverview Evaluates and improves the quality of generated questions.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const EvaluateQualityInputSchema = z.object({
    questions: z.array(z.object({
        id: z.string(),
        type: z.enum(['multiple_choice', 'true_false', 'ordering', 'association', 'open_ended', 'fill_blank']),
        question: z.string(),
        correctAnswer: z.string(),
        incorrectAnswers: z.array(z.string()).optional(),
        explanation: z.string(),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        conceptId: z.string(),
    })).describe('Questions to evaluate'),
    documentContext: z.object({
        subject: z.string(),
        academicLevel: z.string(),
        mainTopics: z.array(z.string()),
    }).describe('Document context for evaluation'),
});
const QualityIssue = z.object({
    questionId: z.string(),
    issue: z.enum(['unclear_question', 'ambiguous_answer', 'poor_distractors', 'inappropriate_difficulty', 'factual_error', 'irrelevant_content']),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    suggestion: z.string(),
});
const ImprovedQuestion = z.object({
    id: z.string(),
    type: z.enum(['multiple_choice', 'true_false', 'ordering', 'association', 'open_ended', 'fill_blank']),
    question: z.string(),
    correctAnswer: z.string(),
    incorrectAnswers: z.array(z.string()).optional(),
    explanation: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    conceptId: z.string(),
    qualityScore: z.number().describe('Quality score from 0-100'),
    improvements: z.array(z.string()).describe('List of improvements made'),
});
const EvaluateQualityOutputSchema = z.object({
    qualityReport: z.object({
        overallScore: z.number().describe('Overall quality score from 0-100'),
        totalQuestions: z.number(),
        questionsApproved: z.number(),
        questionsImproved: z.number(),
        questionsRejected: z.number(),
        issuesFound: z.array(QualityIssue),
    }).describe('Quality evaluation report'),
    improvedQuestions: z.array(ImprovedQuestion).describe('Questions that passed quality evaluation or were improved'),
    rejectedQuestions: z.array(z.object({
        id: z.string(),
        originalQuestion: z.string(),
        rejectionReason: z.string(),
    })).describe('Questions that were rejected due to poor quality'),
});
export const evaluateQualityFlow = ai.defineFlow({
    name: 'evaluateQualityFlow',
    inputSchema: EvaluateQualityInputSchema,
    outputSchema: EvaluateQualityOutputSchema,
}, async (input) => {
    const response = await ai.generate({
        messages: [
            {
                role: 'system',
                content: [
                    {
                        text: `Eres un experto evaluador de calidad educativa especializado en ${input.documentContext.subject}. Tu tarea es evaluar la calidad de preguntas educativas y mejorarlas cuando sea necesario. Evalúas claridad, precisión, relevancia pedagógica y adecuación al nivel académico ${input.documentContext.academicLevel}.`
                    }
                ]
            },
            {
                role: 'user',
                content: [
                    {
                        text: `Evalúa la calidad de estas preguntas educativas sobre ${input.documentContext.subject}:

CONTEXTO:
- Materia: ${input.documentContext.subject}
- Nivel académico: ${input.documentContext.academicLevel}
- Temas principales: ${input.documentContext.mainTopics.join(', ')}

PREGUNTAS A EVALUAR:
${JSON.stringify(input.questions, null, 2)}

CRITERIOS DE EVALUACIÓN:
1. **Claridad**: ¿La pregunta es clara y sin ambigüedades?
2. **Precisión**: ¿La respuesta correcta es factualmente precisa?
3. **Relevancia**: ¿La pregunta es relevante para el tema y nivel educativo?
4. **Distractores**: ¿Los distractores son plausibles pero claramente incorrectos?
5. **Dificultad**: ¿El nivel de dificultad es apropiado para el nivel académico?
6. **Pedagogía**: ¿La pregunta promueve el aprendizaje efectivo?

ESCALAS DE PUNTUACIÓN:
- 90-100: Excelente calidad, lista para usar
- 70-89: Buena calidad, mejoras menores
- 50-69: Calidad moderada, mejoras significativas necesarias
- 0-49: Baja calidad, rechazar o rehacer completamente

INSTRUCCIONES:
1. Evalúa cada pregunta según los criterios
2. Asigna una puntuación de calidad (0-100)
3. Identifica problemas específicos
4. Mejora las preguntas que lo necesiten
5. Rechaza preguntas que no se puedan mejorar satisfactoriamente
6. Proporciona un reporte general de calidad

Para preguntas de opción múltiple, asegúrate de que:
- Solo una respuesta sea claramente correcta
- Los distractores sean plausibles pero incorrectos
- No haya pistas en la redacción que revelen la respuesta

Para preguntas abiertas, asegúrate de que:
- Promuevan pensamiento crítico
- Tengan criterios claros de evaluación
- Sean apropiadas para el nivel académico`
                    }
                ]
            }
        ],
        model: 'googleai/gemini-2.5-flash-lite',
        output: {
            schema: EvaluateQualityOutputSchema,
            format: 'json'
        },
        config: {
            temperature: 0.1,
            maxOutputTokens: 16384
        },
    });
    if (!(response === null || response === void 0 ? void 0 : response.output)) {
        throw new Error('Failed to evaluate question quality.');
    }
    return response.output;
});
export async function evaluateQuality(input) {
    return evaluateQualityFlow(input);
}
