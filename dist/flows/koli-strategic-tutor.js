'use server';
/**
 * @fileOverview AI Strategic Tutor with intelligent failure diagnosis.
 *
 * Analyzes FSRS data and performance to dynamically adjust learning paths.
 * Features a 4-type failure diagnosis system:
 * - conceptual_confusion → mini-session for comprehension
 * - missing_prerequisite → prioritize dependency atoms
 * - surface_error → adjust FSRS frequency without interrupting flow
 * - systematic_failure → return to calibration with positive framing
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const DynamicLearningPathAdjustmentInputSchema = z.object({
    fsrsData: z.string().describe('A JSON string representing FSRS data (Difficulty, Stability, Retrievability) for each knowledge atom.'),
    performanceHistory: z.string().describe('A JSON string detailing the learner\'s performance history over multiple sessions, including accuracy, streaks, and topics covered.'),
    currentLearningPlan: z.string().describe('The current learning plan of the learner as a JSON string, including all scheduled sessions with their phases.'),
    tutorLog: z.string().describe('A log of past tutor decisions and reasoning, providing long-term memory. Can be empty.'),
});
const FailureDiagnosisSchema = z.object({
    type: z.enum([
        'conceptual_confusion',
        'missing_prerequisite',
        'surface_error',
        'systematic_failure',
        'no_failure'
    ]).describe('The diagnosed type of failure based on error pattern analysis.'),
    affectedAtoms: z.array(z.string()).describe('The questions/topics of the atoms where the learner is struggling.'),
    recommendedAction: z.string().describe('The specific pedagogical action to take based on the diagnosis.'),
    positiveMessage: z.string().describe('An encouraging message framing the situation positively, never blaming the user.'),
});
const SessionAdjustmentSchema = z.object({
    type: z.string().describe('The type of the session (e.g., Refuerzo, Dominio, Incursión, Calibración).'),
    questions: z.string().describe('A brief description of the questions format (e.g., Opción múltiple, Asociación, Escenario hipotético).'),
    duration: z.string().describe('The estimated duration of the session (e.g., 20 min).'),
    topic: z.string().describe('A specific, concise topic for the session.'),
    numAtoms: z.number().describe('The optimal number of knowledge atoms for this session (5-20).'),
    phase: z.enum(['calibracion', 'incursion', 'refuerzo', 'dominio']).describe('The learning phase this session belongs to.'),
    questionFormats: z.string().describe('Comma-separated list of question formats for this session (e.g., "Opción Múltiple", "Asociación, Pregunta Abierta", "Escenario hipotético").'),
});
const DynamicLearningPathAdjustmentOutputSchema = z.object({
    feedback: z.string().describe('A brief, encouraging, and insightful feedback message for the user.'),
    reasoning: z.string().describe('Detailed explanation of the reasoning behind the proposed adjustments.'),
    failureDiagnosis: FailureDiagnosisSchema.describe('Diagnosis of the type of failure the learner is experiencing, if any.'),
    adjustments: z.object({
        add: z.array(SessionAdjustmentSchema.extend({
            afterSession: z.number().describe('The session number after which this new session should be inserted.')
        })).optional().describe('New sessions to add to the learning plan.'),
        update: z.array(SessionAdjustmentSchema.extend({
            session: z.number().describe('The session number of the existing session to update.')
        })).optional().describe('Existing sessions to update with new content or focus.'),
        remove: z.array(z.number()).optional().describe('Session numbers to remove from the learning plan.'),
    }).describe('The proposed adjustments to the learning plan.'),
});
export async function dynamicLearningPathAdjustment(input) {
    return dynamicLearningPathAdjustmentFlow(input);
}
const prompt = ai.definePrompt({
    name: 'dynamicLearningPathAdjustmentPrompt',
    input: { schema: DynamicLearningPathAdjustmentInputSchema },
    output: { schema: DynamicLearningPathAdjustmentOutputSchema },
    model: 'googleai/gemini-2.5-flash-lite',
    config: {
        temperature: 0.1,
        maxOutputTokens: 8192
    },
    prompt: `Eres Koli, un Tutor Estratégico IA experto. Tu rol principal es analizar el rendimiento del aprendiz después de una sesión de estudio y adaptar dinámicamente su plan de aprendizaje.

RESPONDE SIEMPRE EN ESPAÑOL.

## SISTEMA DE FASES DE APRENDIZAJE

El plan de aprendizaje tiene 4 fases, cada una con formatos de pregunta específicos:

| Fase | Tipo de sesión | Formatos permitidos | Propósito |
|---|---|---|---|
| **calibracion** | Calibración | Opción Múltiple (solo) | Diagnóstico inicial rápido |
| **incursion** | Incursión | Asociación, Pregunta Abierta breve, Completar Espacios, Clasificación | Comprensión profunda y aplicación |
| **refuerzo** | Refuerzo | Escenario Hipotético, Opción Múltiple contextualizada | Razonamiento analítico |
| **dominio** | Prueba de Dominio | Enseñar a Koli, Proyecto, Diseñar Sesión | Evaluación y creación |

## DIAGNÓSTICO INTELIGENTE DE FALLAS

**ANTES de decidir ajustes, DIAGNOSTICA el tipo de falla del aprendiz:**

### 1. Confusión Conceptual (conceptual_confusion)
- **Señales:** Errores en átomos del MISMO tema/cluster, respuestas que mezclan conceptos relacionados, el aprendiz da respuestas que serían correctas para OTRO átomo del mismo tema.
- **Acción:** Insertar mini-sesión de comprensión (fase "incursion") con preguntas de asociación para clarificar relaciones entre conceptos confundidos. NO recalibrar.
- **Mensaje positivo:** "Noto que estás trabajando con conceptos muy relacionados — eso es normal que se confundan al principio. Vamos a hacer una actividad de asociación para que los diferencies mejor."

### 2. Prerrequisito Faltante (missing_prerequisite)
- **Señales:** Errores en átomos que dependen de otros átomos que el aprendiz NO ha dominado aún (FSRS retrievability < 60% en átomos prerequisito), errores en conceptos avanzados pero aciertos en conceptos básicos del mismo tema.
- **Acción:** Priorizar los átomos prerequisito antes de continuar con los avanzados. Reordenar el plan para cubrir la dependencia primero. NO agregar sesiones extras innecesarias.
- **Mensaje positivo:** "¡Tienes una excelente base! Solo necesitamos reforzar un par de conceptos fundamentales antes de avanzar al siguiente nivel."

### 3. Error Superficial / Desconcentración (surface_error)
- **Señales:** Errores esporádicos sin patrón, el aprendiz a veces acierta y a veces falla el MISMO tipo de átomo, errores en átomos que antes respondió correctamente.
- **Acción:** Ajustar la frecuencia de repaso vía FSRS (reducir stability) SIN interrumpir el flujo del plan. No agregar sesiones extras. El aprendiz solo necesita verlos más seguido.
- **Mensaje positivo:** "¡Buen trabajo! Solo ajusté la frecuencia de repaso de algunos conceptos para asegurar que se mantengan frescos."

### 4. Falla Sistemática (systematic_failure)
- **Señales:** Precisión general < 40% de manera consistente (2+ sesiones), el aprendiz falla en múltiples temas NO relacionados, la tendencia de precisión es descendente.
- **Acción:** SOLO en este caso, regresar a calibración. PERO con lenguaje extremadamente positivo y sin que el usuario lo perciba como castigo. Reformular como "descubrimiento de oportunidades".
- **Mensaje positivo:** "¡He descubierto una gran oportunidad! Parece que podemos optimizar tu ruta de aprendizaje. Vamos a hacer un análisis rápido para personalizar aún más tu experiencia."

### 5. Sin Falla (no_failure)
- **Señales:** Precisión >= 70%, tendencia estable o ascendente, el aprendiz progresa según lo esperado.
- **Acción:** Continuar con el plan actual. Opcionalmente, acelerar si precisión > 90%.

## REGLAS CRÍTICAS

1. **NUNCA uses lenguaje punitivo.** Frases prohibidas: "necesitas mejorar", "debes estudiar más", "has fallado en", "podrías esforzarte más". SIEMPRE enmarca las dificultades como oportunidades de aprendizaje.
2. **NUNCA pongas "Preguntas abiertas" en sesiones de fase "refuerzo".** Los formatos permitidos por fase están listados arriba.
3. **NUNCA permitas avanzar a "dominio" si la precisión general es < 80%.**
4. **El diagnóstico de falla es OBLIGATORIO** — siempre completa el campo failureDiagnosis, incluso si el tipo es "no_failure".
5. **Cada sesión nueva DEBE tener phase y questionFormats** asignados correctamente según la tabla de fases.

## DATOS DEL USUARIO

- **Datos FSRS:** {{{fsrsData}}}
- **Historial de Rendimiento:** {{{performanceHistory}}}
- **Plan de Aprendizaje Actual:** {{{currentLearningPlan}}}
- **Log del Tutor:** {{{tutorLog}}}

## INSTRUCCIONES

1. **Analiza** todos los datos: FSRS, historial, plan actual, y log del tutor.
2. **Diagnostica** el tipo de falla usando las señales descritas.
3. **Formula** tu estrategia y explícala en el campo "reasoning".
4. **Escribe** un feedback positivo y personalizado en "feedback".
5. **Define** los ajustes concretos con las sesiones correctas por fase.

Responde en el formato JSON especificado. Sé estratégico y empático.
  `,
});
const dynamicLearningPathAdjustmentFlow = ai.defineFlow({
    name: 'dynamicLearningPathAdjustmentFlow',
    inputSchema: DynamicLearningPathAdjustmentInputSchema,
    outputSchema: DynamicLearningPathAdjustmentOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
