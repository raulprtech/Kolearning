
'use server';

/**
 * @fileOverview AI flow for the "Koli Ignorante" mastery test mode.
 * Koli pretends not to know a concept and the user must teach it.
 * After 3-5 exchanges, Koli evaluates whether the user demonstrated true mastery.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KoliIgnoranteInputSchema = z.object({
    concept: z.string().describe('The concept the user should be teaching.'),
    expectedExplanation: z.string().describe('The expected correct explanation of the concept.'),
    conversationHistory: z.string().describe('JSON string of the conversation messages so far.'),
    exchangeCount: z.number().describe('How many exchanges have occurred (1 exchange = 1 user message).'),
    shouldEvaluate: z.boolean().describe('Whether Koli should perform a final mastery evaluation.'),
});

export type KoliIgnoranteInput = z.infer<typeof KoliIgnoranteInputSchema>;

const KoliIgnoranteOutputSchema = z.object({
    response: z.string().describe('Koli\'s response message in the conversation.'),
    evaluationDone: z.boolean().describe('Whether Koli has completed its mastery evaluation.'),
    mastered: z.boolean().describe('Whether the user demonstrated mastery of the concept.'),
    evaluationFeedback: z.string().optional().describe('Detailed feedback on the user\'s teaching performance if evaluationDone is true.'),
});

export type KoliIgnoranteOutput = z.infer<typeof KoliIgnoranteOutputSchema>;

export async function koliIgnoranteRespond(input: KoliIgnoranteInput): Promise<KoliIgnoranteOutput> {
    return koliIgnoranteFlow(input);
}

const koliIgnorantePrompt = ai.definePrompt({
    name: 'koliIgnorantePrompt',
    input: { schema: KoliIgnoranteInputSchema },
    output: { schema: KoliIgnoranteOutputSchema },
    model: 'googleai/gemini-2.5-flash-lite',
    config: {
        temperature: 0.4,
        maxOutputTokens: 2048,
    },
    prompt: `Eres Koli en modo "Ignorante". Estás fingiendo que NO sabes nada sobre un concepto, y un estudiante te está enseñando. Tu objetivo es:

1. **Hacer preguntas genuinamente curiosas** que obliguen al estudiante a explicar con profundidad.
2. **Detectar explicaciones superficiales** y pedir más detalle amablemente.
3. **Evaluar si el estudiante realmente domina el tema** después de 3-5 intercambios.

RESPONDE SIEMPRE EN ESPAÑOL.

## PERSONA

- Eres curioso, entusiasta, pero genuinamente perdido sobre el tema.
- Haces preguntas como: "¿Pero eso qué significa exactamente?", "¿Y por qué no funciona de otra manera?", "¿Me podrías dar un ejemplo?"
- NUNCA reveles que en realidad sabes la respuesta.
- Usa emojis moderadamente para parecer accesible (🤔, 💡, 🙏).

## PREGUNTAS SONDA EFECTIVAS

Tipos de preguntas para probar comprensión profunda:
- **Definición:** "¿Qué es exactamente X?"
- **Causa:** "¿Por qué funciona así?"
- **Contraste:** "¿Y cuál es la diferencia entre X e Y?"
- **Aplicación:** "¿Me puedes dar un ejemplo concreto?"
- **Límites:** "¿Cuándo NO se aplica esto?"
- **Conexión:** "¿Cómo se relaciona esto con Z?"

## EVALUACIÓN (cuando shouldEvaluate es true)

Evalúa si el estudiante demostró:
1. ✅ Comprensión correcta del concepto
2. ✅ Capacidad de explicar con sus propias palabras
3. ✅ Capacidad de dar ejemplos relevantes
4. ✅ Comprensión de los límites o excepciones

**mastered = true** si cumple al menos 3 de los 4 criterios.

Si shouldEvaluate es true:
- PRIMERO da una respuesta natural que cierre la conversación agradeciendo al usuario.
- SET evaluationDone = true
- SET mastered = true/false basado en los criterios
- SET evaluationFeedback con un resumen detallado

Si shouldEvaluate es false:
- Haz una pregunta sonda para profundizar
- SET evaluationDone = false y mastered = false

## DATOS

- **Concepto a enseñar:** {{{concept}}}
- **Explicación esperada:** {{{expectedExplanation}}}
- **Historial de conversación:** {{{conversationHistory}}}
- **Número de intercambio:** {{{exchangeCount}}}
- **¿Debe evaluar?:** {{{shouldEvaluate}}}

Responde en el formato JSON especificado.
`,
});

const koliIgnoranteFlow = ai.defineFlow(
    {
        name: 'koliIgnoranteFlow',
        inputSchema: KoliIgnoranteInputSchema,
        outputSchema: KoliIgnoranteOutputSchema,
    },
    async (input) => {
        const { output } = await koliIgnorantePrompt(input);
        return output!;
    }
);
