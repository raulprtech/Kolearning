// src/ai/flows/koli-calibrate-plan.ts
'use server';
/**
 * @fileOverview Genkit flow for calibrating initial learning plans.
 *
 * Generates plans with 4 learning phases:
 * - Calibración: MC-only diagnostic (5-10 atoms)
 * - Incursión: Comprehension via association + open-ended questions
 * - Refuerzo: Analytical reasoning via hypothetical scenarios
 * - Prueba de Dominio: Mastery test adapted to knowledge type
 *
 * IMPORTANT: Uses atom INDICES (0-based) instead of question text matching,
 * because LLMs cannot reliably copy exact text strings.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const AtomSchema = z.object({
    question: z.string(),
    answer: z.string(),
});
const CalibratePlanInputSchema = z.object({
    atoms: z.array(AtomSchema).describe('The complete list of knowledge atoms generated from the material.'),
    projectTitle: z.string().describe('The title for the learning project provided by the user.'),
});
// --- Raw AI output schemas (relaxed types to tolerate AI flakiness) ---
const RawSessionSchema = z.object({
    session: z.number().describe('Sequential session number (1, 2, 3...).'),
    topic: z.string().describe('What the user will learn in this session.'),
    sessionType: z.string().describe('Session type: Calibración, Incursión, Refuerzo, or Prueba de Dominio.'),
    questions: z.string().describe('The question format description for this session.'),
    atomIndices: z.array(z.number()).describe('An array of 0-based indices referring to the atoms list. For example, [0, 3, 5] means atoms at positions 0, 3, and 5.'),
    numAtoms: z.number().optional().describe('Number of atoms for this session (5-20).'),
    phase: z.string().optional().describe('The learning phase: calibracion, incursion, refuerzo, or dominio.'),
    questionFormats: z.string().optional().describe('Comma-separated question formats.'),
});
const RawCalibratePlanOutputSchema = z.object({
    projectDescription: z.string().describe('A brief, one-sentence description of the project.'),
    categories: z.array(z.string()).describe('An array of one to three relevant categories for the project.'),
    learningPath: z.array(z.object({
        day: z.number().describe("The day number, starting from 1."),
        sessions: z.array(RawSessionSchema).describe("An array of sessions for this specific day.")
    })).describe('The structured learning path with sessions grouped by day.'),
    koliJustification: z.string().optional().describe('Justification of the pedagogical strategy.'),
    expectedProgress: z.string().optional().describe('Encouraging paragraph about expected learning.'),
    fullLearningPlanMarkdown: z.string().optional().describe('The full learning plan in Markdown format.'),
});
// --- Final strict output schemas (for the rest of the application) ---
const SessionSchema = z.object({
    session: z.number(),
    topic: z.string(),
    sessionType: z.string(),
    questions: z.string(),
    atoms: z.array(AtomSchema),
    numAtoms: z.number(),
    phase: z.enum(['calibracion', 'incursion', 'refuerzo', 'dominio']),
    questionFormats: z.string(),
});
const CalibratePlanOutputSchema = z.object({
    projectDescription: z.string(),
    categories: z.array(z.string()),
    atoms: z.array(AtomSchema),
    learningPath: z.array(z.object({
        day: z.number(),
        sessions: z.array(SessionSchema)
    })),
    koliJustification: z.string(),
    expectedProgress: z.string(),
    fullLearningPlanMarkdown: z.string(),
});
export async function calibratePlanFromQuestionnaire(input) {
    return calibratePlanFlow(input);
}
const calibratePlanPrompt = ai.definePrompt({
    name: 'calibratePlanPrompt',
    input: { schema: CalibratePlanInputSchema },
    output: { schema: RawCalibratePlanOutputSchema },
    model: 'googleai/gemini-2.5-flash',
    config: {
        temperature: 0.1,
        maxOutputTokens: 8192
    },
    prompt: `Eres Koli, un Tutor Estratégico IA, diseñado para crear planes de aprendizaje personalizados basados en un marco pedagógico profundo.

RESPONDE SIEMPRE EN ESPAÑOL.

El aprendiz ha proporcionado su material de estudio, que ha sido convertido en "Átomos de Conocimiento", y ha dado un título a su proyecto.

**Título del Proyecto:** {{{projectTitle}}}

## TUS TAREAS

### 1. Analizar y Definir el Proyecto
- Revisa cuidadosamente los átomos para entender la materia.
- Genera un 'projectDescription' conciso de una oración.
- Genera entre 1-3 'categories' apropiadas.

### 2. Crear el Plan de Aprendizaje

Genera un 'learningPath' estructurado por días. **Cada sesión DEBE tener los campos 'numAtoms', 'phase', 'questionFormats' y 'atomIndices'.**

#### CÓMO REFERENCIAR ÁTOMOS
- Los átomos están numerados desde 0. Usa el campo 'atomIndices' para indicar qué átomos pertenecen a cada sesión.
- Ejemplo: Si hay 22 átomos (índices 0-21), y una sesión usa los átomos 0, 1, 2, 5, 7: atomIndices = [0, 1, 2, 5, 7]
- **NO copies el texto de las preguntas.** Solo usa los índices numéricos.

#### REQUISITO DE COBERTURA TOTAL
- **DEBES UTILIZAR TODOS LOS ÁTOMOS proporcionados.** Ningún átomo debe quedar fuera del plan de aprendizaje.
- Distribuye los átomos a lo largo de las sesiones de manera lógica:
    - **Calibración:** 5-10 átomos representativos para diagnóstico.
    - **Incursión:** Presenta los átomos por primera vez.
    - **Refuerzo:** Practica átomos ya vistos para consolidar.
    - **Prueba de Dominio:** Evaluación final de todos los átomos del proyecto.

#### FASES Y FORMATOS OBLIGATORIOS

| Fase | sessionType | phase | questionFormats | Propósito | numAtoms |
|---|---|---|---|---|---|
| **Calibración** | "Calibración" | "calibracion" | "Opción Múltiple" | Diagnóstico rápido | 5-10 |
| **Incursión (1ª mitad)** | "Incursión" | "incursion" | "Asociación, Pregunta Abierta" | Comprensión profunda | 8-15 |
| **Incursión (2ª mitad)** | "Incursión" | "incursion" | "Completar Espacios, Clasificación" | Aplicación | 8-15 |
| **Refuerzo** | "Refuerzo" | "refuerzo" | "Escenario Hipotético, Opción Múltiple" | Razonamiento analítico | 10-15 |
| **Prueba de Dominio** | "Prueba de Dominio" | "dominio" | "Enseñar a Koli, Pregunta Abierta" | Evaluación y creación | 5-15 |

#### REGLAS DE ESTRUCTURA

1. **Día 1** siempre comienza con una sesión de **Calibración** (solo Opción Múltiple, 5-10 átomos).
2. Después de la calibración, siguen las sesiones de **Incursión** para introducir conceptos nuevos.
3. Las sesiones de **Refuerzo** van intercaladas o al final para consolidar.
4. La **Prueba de Dominio** es la última sesión del plan.
5. Los números de sesión ('session') DEBEN ser enteros secuenciales (1, 2, 3...).
6. Distribuye en 3-7 días para temas de tamaño moderado.
7. Para cada sesión, usa 'atomIndices' con los índices de los átomos que corresponden.
8. El campo 'questions' debe describir el formato (ej: "Opción Múltiple", "Pregunta Abierta y Casos Prácticos").

#### LÓGICA DE SUB-MÓDULOS

Si el material es extenso:
- Divide en sub-módulos temáticos.
- Cada sub-módulo puede tener su propio ciclo: Incursión → Refuerzo.
- La Calibración es global (solo una al inicio).
- La Prueba de Dominio puede ser global o por sub-módulo si el material es muy extenso.

### 3. Generar Justificación y Progreso
- **koliJustification:** Explica la estrategia pedagógica y la distribución diaria.
- **expectedProgress:** Párrafo alentador sobre el progreso esperado.
- **fullLearningPlanMarkdown:** Plan completo en Markdown con formato legible.

## ÁTOMOS DE CONOCIMIENTO (Numerados desde 0)

{{{atoms}}}

## REQUISITOS CRÍTICOS

- Usa SOLO los índices de los átomos proporcionados. NO crees átomos nuevos.
- CADA sesión DEBE tener todos los campos: session, topic, sessionType, questions, atomIndices, numAtoms, phase, questionFormats.
- INCLUYE TODOS los campos del output: projectDescription, categories, learningPath, koliJustification, expectedProgress, fullLearningPlanMarkdown.
- atomIndices DEBE contener SOLO números enteros válidos correspondientes a los índices de los átomos listados arriba (empezando desde 0).

Responde en el formato JSON especificado.
`,
});
const calibratePlanFlow = ai.defineFlow({
    name: 'calibratePlanFlow',
    inputSchema: CalibratePlanInputSchema,
    outputSchema: CalibratePlanOutputSchema,
}, async (input) => {
    console.log('=== CALIBRATE PLAN INPUT ===');
    console.log('Atoms received:', input.atoms.length);
    console.log('Sample atoms:', input.atoms.slice(0, 3).map((a, i) => `[${i}] ${a.question}`));
    console.log('Project title:', input.projectTitle);
    // Format atoms with indices for the prompt
    const numberedInput = Object.assign(Object.assign({}, input), { atoms: input.atoms.map((a, i) => (Object.assign(Object.assign({}, a), { question: `[Átomo ${i}] ${a.question}` }))) });
    const { output } = await calibratePlanPrompt(numberedInput);
    if (!output) {
        throw new Error('AI failed to generate a learning plan.');
    }
    // Process learning path: resolve indices to actual atoms
    const processedLearningPath = output.learningPath.map(day => (Object.assign(Object.assign({}, day), { sessions: day.sessions.map(session => {
            var _a;
            // Resolve atom indices to actual atoms
            const validIndices = (session.atomIndices || []).filter(idx => typeof idx === 'number' && idx >= 0 && idx < input.atoms.length);
            const invalidIndices = (session.atomIndices || []).filter(idx => typeof idx !== 'number' || idx < 0 || idx >= input.atoms.length);
            if (invalidIndices.length > 0) {
                console.warn(`[PlanFlow] Session ${session.session}: ${invalidIndices.length} invalid indices: ${invalidIndices.join(', ')}`);
            }
            const hydratedAtoms = validIndices.map(idx => input.atoms[idx]);
            console.log(`[PlanFlow] Session ${session.session}: ${hydratedAtoms.length} atoms hydrated from indices [${validIndices.join(', ')}]`);
            // Infer phase from sessionType if missing or invalid
            const rawPhase = ((_a = session.phase) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) || '';
            let phase;
            if (['calibracion', 'incursion', 'refuerzo', 'dominio'].includes(rawPhase)) {
                phase = rawPhase;
            }
            else {
                const type = session.sessionType.toLowerCase();
                if (type.includes('calibración'))
                    phase = 'calibracion';
                else if (type.includes('incursión'))
                    phase = 'incursion';
                else if (type.includes('refuerzo'))
                    phase = 'refuerzo';
                else if (type.includes('dominio'))
                    phase = 'dominio';
                else
                    phase = 'incursion'; // Default
            }
            // Infer questionFormats if missing
            let questionFormats = session.questionFormats;
            if (!questionFormats) {
                if (phase === 'calibracion')
                    questionFormats = 'Opción Múltiple';
                else if (phase === 'incursion')
                    questionFormats = 'Asociación, Pregunta Abierta';
                else if (phase === 'refuerzo')
                    questionFormats = 'Escenario Hipotético, Opción Múltiple';
                else if (phase === 'dominio')
                    questionFormats = 'Enseñar a Koli, Pregunta Abierta';
                else
                    questionFormats = 'Opción Múltiple';
            }
            return {
                session: session.session,
                topic: session.topic,
                sessionType: session.sessionType,
                questions: session.questions,
                atoms: hydratedAtoms,
                numAtoms: hydratedAtoms.length,
                phase,
                questionFormats,
            };
        }) })));
    console.log('=== CALIBRATE PLAN OUTPUT ===');
    const totalSessions = processedLearningPath.flatMap(day => day.sessions).length;
    const totalHydratedAtoms = processedLearningPath.flatMap(day => day.sessions).reduce((acc, s) => acc + s.atoms.length, 0);
    console.log(`Learning path: ${totalSessions} sessions, ${totalHydratedAtoms} total atom assignments`);
    // Ensure required fields have defaults if the AI omitted them
    const result = Object.assign(Object.assign({}, output), { atoms: input.atoms, learningPath: processedLearningPath, koliJustification: output.koliJustification || 'Plan generado automáticamente por Koli.', expectedProgress: output.expectedProgress || 'Progreso esperado según el plan de estudio.', fullLearningPlanMarkdown: output.fullLearningPlanMarkdown || '' });
    return result;
});
