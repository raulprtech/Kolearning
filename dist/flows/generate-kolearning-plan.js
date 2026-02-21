'use server';
/**
 * @fileOverview Generates study plans using KoLearning methodology.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const GenerateKolearningPlanInputSchema = z.object({
    conceptMap: z.object({
        totalConcepts: z.number(),
        relationships: z.array(z.object({
            fromConcept: z.string(),
            toConcept: z.string(),
            relationshipType: z.string(),
            strength: z.string(),
            description: z.string(),
            pedagogicalImportance: z.string(),
        })),
        clusters: z.array(z.object({
            clusterId: z.string(),
            name: z.string(),
            description: z.string(),
            concepts: z.array(z.string()),
            centralConcept: z.string(),
            difficulty: z.string(),
            estimatedStudyTime: z.number(),
        })),
        learningPaths: z.array(z.object({
            pathId: z.string(),
            name: z.string(),
            description: z.string(),
            sequence: z.array(z.object({
                step: z.number(),
                conceptOrCluster: z.string(),
                type: z.string(),
                rationale: z.string(),
            })),
            totalEstimatedTime: z.number(),
        })),
    }).describe('Concept relationship map'),
    questions: z.array(z.object({
        id: z.string(),
        type: z.string(),
        question: z.string(),
        correctAnswer: z.string(),
        incorrectAnswers: z.array(z.string()).optional(),
        explanation: z.string(),
        difficulty: z.string(),
        conceptId: z.string(),
        qualityScore: z.number().optional(),
    })).describe('Quality-evaluated questions'),
    userPreferences: z.object({
        availableTimePerSession: z.number().describe('Minutes available per study session'),
        totalAvailableTime: z.number().describe('Total available study time in minutes'),
        learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']).optional(),
        difficultyPreference: z.enum(['gradual', 'challenging', 'mixed']).optional(),
    }).describe('User study preferences'),
    documentContext: z.object({
        subject: z.string(),
        academicLevel: z.string(),
        mainTopics: z.array(z.string()),
    }).describe('Document context'),
});
const StudySession = z.object({
    sessionId: z.string(),
    sessionNumber: z.number(),
    title: z.string(),
    description: z.string(),
    estimatedDuration: z.number().describe('Duration in minutes'),
    learningObjectives: z.array(z.string()),
    concepts: z.array(z.string()).describe('Concepts covered in this session'),
    questions: z.array(z.string()).describe('Question IDs for this session'),
    activities: z.array(z.object({
        type: z.enum(['introduction', 'concept_review', 'practice', 'assessment', 'reflection']),
        description: z.string(),
        estimatedTime: z.number(),
        questions: z.array(z.string()).optional(),
    })),
    prerequisites: z.array(z.string()).describe('Previous sessions that must be completed'),
    kolearningElements: z.object({
        atomicLearning: z.boolean().describe('Uses atomic learning approach'),
        spacedRepetition: z.boolean().describe('Includes spaced repetition'),
        activeRecall: z.boolean().describe('Promotes active recall'),
        interleaving: z.boolean().describe('Interleaves different concepts'),
        elaborativeInterrogation: z.boolean().describe('Uses elaborative questioning'),
    }),
});
const MasteryMilestone = z.object({
    milestoneId: z.string(),
    name: z.string(),
    description: z.string(),
    requiredSessions: z.array(z.string()),
    assessmentQuestions: z.array(z.string()),
    masteryThreshold: z.number().describe('Percentage required to pass (0-100)'),
    concepts: z.array(z.string()),
});
const GenerateKolearningPlanOutputSchema = z.object({
    studyPlan: z.object({
        planId: z.string(),
        title: z.string(),
        description: z.string(),
        totalSessions: z.number(),
        totalEstimatedTime: z.number().describe('Total time in minutes'),
        averageSessionTime: z.number().describe('Average session time in minutes'),
        sessions: z.array(StudySession),
        milestones: z.array(MasteryMilestone),
    }).describe('Complete KoLearning study plan'),
    methodology: z.object({
        kolearningPrinciples: z.array(z.string()).describe('KoLearning principles applied'),
        learningSequence: z.string().describe('Rationale for the learning sequence'),
        adaptiveFeatures: z.array(z.string()).describe('How the plan adapts to user progress'),
        assessmentStrategy: z.string().describe('How mastery will be measured'),
    }).describe('Methodology explanation'),
    recommendations: z.object({
        studyTips: z.array(z.string()),
        timeManagement: z.string(),
        difficultyProgression: z.string(),
        retentionStrategies: z.array(z.string()),
    }).describe('Study recommendations'),
    analytics: z.object({
        conceptCoverage: z.record(z.number()).describe('Percentage of time spent on each concept'),
        difficultyDistribution: z.record(z.number()).describe('Distribution of question difficulties'),
        questionTypeDistribution: z.record(z.number()).describe('Distribution of question types'),
        estimatedCompletionRate: z.number().describe('Estimated percentage of users who will complete'),
    }).describe('Plan analytics'),
});
export const generateKolearningPlanFlow = ai.defineFlow({
    name: 'generateKolearningPlanFlow',
    inputSchema: GenerateKolearningPlanInputSchema,
    outputSchema: GenerateKolearningPlanOutputSchema,
}, async (input) => {
    const response = await ai.generate({
        messages: [
            {
                role: 'system',
                content: [
                    {
                        text: `Eres el experto principal en la metodología KoLearning, un enfoque pedagógico innovador que combina aprendizaje atómico, repetición espaciada, recuperación activa, intercalado de conceptos e interrogación elaborativa. Tu misión es crear planes de estudio personalizados y altamente efectivos para ${input.documentContext.subject} nivel ${input.documentContext.academicLevel}.

PRINCIPIOS FUNDAMENTALES DE KOLEARNING:

1. **APRENDIZAJE ATÓMICO**: Divide el conocimiento en unidades mínimas comprensibles
2. **REPETICIÓN ESPACIADA**: Repite conceptos en intervalos optimizados para la retención
3. **RECUPERACIÓN ACTIVA**: Prioriza la práctica de recordar sobre la relectura pasiva
4. **INTERCALADO**: Mezcla diferentes conceptos para fortalecer la discriminación
5. **INTERROGACIÓN ELABORATIVA**: Usa preguntas que profundizan la comprensión

METODOLOGÍA DE SESIONES:
- Cada sesión debe durar entre 15-45 minutos (micro-learning)
- Estructura: Activación → Aprendizaje → Práctica → Evaluación → Reflexión
- Progresión gradual con prerequisitos claros
- Evaluación continua de la comprensión
- Adaptación basada en el rendimiento del estudiante`
                    }
                ]
            },
            {
                role: 'user',
                content: [
                    {
                        text: `Diseña un plan de estudio completo usando la metodología KoLearning para este material de ${input.documentContext.subject}:

MAPA CONCEPTUAL:
${JSON.stringify(input.conceptMap, null, 2)}

PREGUNTAS DISPONIBLES:
${JSON.stringify(input.questions.map(q => ({
                            id: q.id,
                            type: q.type,
                            question: q.question.substring(0, 100) + '...',
                            difficulty: q.difficulty,
                            conceptId: q.conceptId,
                            qualityScore: q.qualityScore
                        })), null, 2)}

PREFERENCIAS DEL USUARIO:
- Tiempo por sesión: ${input.userPreferences.availableTimePerSession} minutos
- Tiempo total disponible: ${input.userPreferences.totalAvailableTime} minutos
- Estilo de aprendizaje: ${input.userPreferences.learningStyle || 'no especificado'}
- Preferencia de dificultad: ${input.userPreferences.difficultyPreference || 'gradual'}

CONTEXTO:
- Materia: ${input.documentContext.subject}
- Nivel: ${input.documentContext.academicLevel}
- Temas: ${input.documentContext.mainTopics.join(', ')}

INSTRUCCIONES ESPECÍFICAS:

1. **DISEÑO DE SESIONES**:
   - Crea sesiones de ${input.userPreferences.availableTimePerSession} minutos cada una
   - Cada sesión debe tener 3-5 conceptos máximo (principio atómico)
   - Incluye actividades de activación, aprendizaje, práctica y evaluación
   - Asegura prerequisitos claros entre sesiones

2. **SECUENCIACIÓN**:
   - Sigue las rutas de aprendizaje del mapa conceptual
   - Implementa progresión de dificultad gradual
   - Incluye revisiones periódicas (repetición espaciada)
   - Intercala conceptos relacionados

3. **EVALUACIÓN Y MILESTONES**:
   - Crea milestones de dominio cada 3-5 sesiones
   - Define umbrales de aprobación realistas (70-85%)
   - Incluye preguntas de diferentes tipos y dificultades
   - Permite evaluación continua del progreso

4. **PERSONALIZACIÓN**:
   - Adapta el plan al tiempo disponible del usuario
   - Considera el estilo de aprendizaje preferido
   - Ajusta la dificultad según las preferencias
   - Incluye estrategias de retención específicas

5. **METODOLOGÍA KOLEARNING**:
   - Identifica claramente qué principios se aplican en cada sesión
   - Explica la secuencia de aprendizaje elegida
   - Describe las características adaptativas
   - Define la estrategia de evaluación

6. **RECOMENDACIONES**:
   - Proporciona consejos específicos de estudio
   - Sugiere técnicas de gestión del tiempo
   - Recomienda estrategias de retención
   - Explica la progresión de dificultad

El plan debe ser práctico, personalizado y pedagógicamente sólido, maximizando la retención y comprensión del estudiante.`
                    }
                ]
            }
        ],
        model: 'googleai/gemini-2.5-flash',
        output: {
            schema: GenerateKolearningPlanOutputSchema,
            format: 'json'
        },
        config: {
            temperature: 0.3,
            maxOutputTokens: 16384
        },
    });
    if (!(response === null || response === void 0 ? void 0 : response.output)) {
        throw new Error('Failed to generate KoLearning plan.');
    }
    return response.output;
});
export async function generateKolearningPlan(input) {
    return generateKolearningPlanFlow(input);
}
