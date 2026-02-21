'use server';
/**
 * @fileOverview AI flow for evaluating reasoning quality in scenario-based questions.
 * Used in the Refuerzo phase to assess not just correctness but argumentative strength.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const EvaluateReasoningInputSchema = z.object({
    scenario: z.string().describe('The hypothetical scenario presented to the learner.'),
    question: z.string().describe('The specific question asked about the scenario.'),
    expectedAnswer: z.string().describe('The expected correct reasoning/answer.'),
    userReasoning: z.string().describe('The learner\'s reasoning/answer to evaluate.'),
    relatedConcepts: z.string().describe('Comma-separated list of related concepts for context.'),
});
const EvaluateReasoningOutputSchema = z.object({
    isStrong: z.boolean().describe('Whether the reasoning demonstrates strong understanding (true) or not (false).'),
    strengthScore: z.number().describe('A 0-100 score indicating the strength of the reasoning.'),
    feedback: z.string().describe('Detailed, encouraging feedback about the reasoning quality.'),
    strengths: z.array(z.string()).describe('List of specific strengths in the reasoning.'),
    improvements: z.array(z.string()).describe('List of specific areas where the reasoning could improve.'),
});
export async function evaluateReasoning(input) {
    return evaluateReasoningFlow(input);
}
const evaluateReasoningPrompt = ai.definePrompt({
    name: 'evaluateReasoningPrompt',
    input: { schema: EvaluateReasoningInputSchema },
    output: { schema: EvaluateReasoningOutputSchema },
    model: 'googleai/gemini-2.5-flash-lite',
    config: {
        temperature: 0.2,
        maxOutputTokens: 4096,
    },
    prompt: `Eres un evaluador experto de razonamiento analítico. Tu tarea es evaluar la calidad del razonamiento de un estudiante en respuesta a un escenario hipotético.

RESPONDE SIEMPRE EN ESPAÑOL.

## CRITERIOS DE EVALUACIÓN

Evalúa el razonamiento del estudiante en estos 4 ejes:

1. **Relevancia** (¿El razonamiento aborda directamente la pregunta?)
2. **Profundidad** (¿Demuestra comprensión más allá de lo superficial?)
3. **Coherencia lógica** (¿Los argumentos fluyen lógicamente?)
4. **Uso de conceptos** (¿Aplica correctamente los conceptos relacionados?)

## REGLAS

- **NUNCA seas punitivo.** Usa lenguaje constructivo: "podrías fortalecer..." en vez de "te falta...".
- Un razonamiento con ideas correctas pero mal articuladas merece un puntaje moderado (40-60), no bajo.
- Un razonamiento que demuestra comprensión pero es incompleto merece un puntaje medio-alto (60-80).
- Solo puntajes < 40 para razonamientos completamente incorrectos o irrelevantes.
- **isStrong = true** si strengthScore >= 60.

## DATOS

- **Escenario:** {{{scenario}}}
- **Pregunta:** {{{question}}}
- **Respuesta esperada:** {{{expectedAnswer}}}
- **Razonamiento del estudiante:** {{{userReasoning}}}
- **Conceptos relacionados:** {{{relatedConcepts}}}

Proporciona tu evaluación en el formato JSON especificado.
`,
});
const evaluateReasoningFlow = ai.defineFlow({
    name: 'evaluateReasoningFlow',
    inputSchema: EvaluateReasoningInputSchema,
    outputSchema: EvaluateReasoningOutputSchema,
}, async (input) => {
    const { output } = await evaluateReasoningPrompt(input);
    return output;
});
