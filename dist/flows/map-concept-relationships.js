'use server';
/**
 * @fileOverview Maps relationships between concepts for better understanding.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const MapConceptRelationshipsInputSchema = z.object({
    concepts: z.array(z.object({
        concept: z.string(),
        definition: z.string(),
        importance: z.string(),
        category: z.string(),
        relatedConcepts: z.array(z.string()),
    })).describe('Concepts to analyze for relationships'),
    questions: z.array(z.object({
        id: z.string(),
        type: z.string(),
        question: z.string(),
        correctAnswer: z.string(),
        conceptId: z.string(),
        qualityScore: z.number().optional(),
    })).describe('Questions associated with concepts'),
    documentContext: z.object({
        subject: z.string(),
        academicLevel: z.string(),
        mainTopics: z.array(z.string()),
    }).describe('Document context'),
});
const ConceptRelationship = z.object({
    fromConcept: z.string(),
    toConcept: z.string(),
    relationshipType: z.enum([
        'prerequisite', // Concept A must be understood before Concept B
        'supports', // Concept A helps understand Concept B
        'similar', // Concepts are similar or related
        'contrasts', // Concepts are opposite or contrasting
        'applies_to', // Concept A is applied in the context of Concept B
        'part_of', // Concept A is part of Concept B
        'example_of', // Concept A is an example of Concept B
        'derives_from' // Concept A is derived from Concept B
    ]),
    strength: z.enum(['weak', 'moderate', 'strong']).describe('Strength of the relationship'),
    description: z.string().describe('Description of how the concepts relate'),
    pedagogicalImportance: z.enum(['low', 'medium', 'high']).describe('Importance for learning sequence'),
});
const ConceptCluster = z.object({
    clusterId: z.string(),
    name: z.string(),
    description: z.string(),
    concepts: z.array(z.string()),
    centralConcept: z.string().describe('Most important concept in this cluster'),
    difficulty: z.enum(['foundational', 'intermediate', 'advanced']),
    estimatedStudyTime: z.number().describe('Estimated study time in minutes'),
});
const LearningPath = z.object({
    pathId: z.string(),
    name: z.string(),
    description: z.string(),
    sequence: z.array(z.object({
        step: z.number(),
        conceptOrCluster: z.string(),
        type: z.enum(['concept', 'cluster']),
        rationale: z.string().describe('Why this step comes at this point'),
    })),
    totalEstimatedTime: z.number().describe('Total estimated study time in minutes'),
});
const MapConceptRelationshipsOutputSchema = z.object({
    conceptMap: z.object({
        totalConcepts: z.number(),
        relationships: z.array(ConceptRelationship),
        clusters: z.array(ConceptCluster),
        learningPaths: z.array(LearningPath),
    }).describe('Complete concept relationship map'),
    studyRecommendations: z.object({
        recommendedStartingPoints: z.array(z.string()).describe('Best concepts to start with'),
        prerequisites: z.record(z.array(z.string())).describe('Prerequisites for each concept'),
        conceptDependencies: z.record(z.array(z.string())).describe('What each concept depends on'),
        difficultyProgression: z.array(z.object({
            level: z.enum(['foundational', 'intermediate', 'advanced']),
            concepts: z.array(z.string()),
        })),
    }).describe('Learning recommendations based on concept relationships'),
    insights: z.object({
        keyFoundationalConcepts: z.array(z.string()),
        mostConnectedConcepts: z.array(z.string()),
        potentialLearningBottlenecks: z.array(z.string()),
        conceptGaps: z.array(z.string()).describe('Important concepts that might be missing'),
    }).describe('Educational insights from the concept analysis'),
});
export const mapConceptRelationshipsFlow = ai.defineFlow({
    name: 'mapConceptRelationshipsFlow',
    inputSchema: MapConceptRelationshipsInputSchema,
    outputSchema: MapConceptRelationshipsOutputSchema,
}, async (input) => {
    const response = await ai.generate({
        messages: [
            {
                role: 'system',
                content: [
                    {
                        text: `Eres un experto en mapeo conceptual y diseño de secuencias de aprendizaje para ${input.documentContext.subject}. Tu especialidad es identificar relaciones entre conceptos y crear rutas de aprendizaje óptimas para estudiantes de nivel ${input.documentContext.academicLevel}.`
                    }
                ]
            },
            {
                role: 'user',
                content: [
                    {
                        text: `Analiza las relaciones entre estos conceptos educativos de ${input.documentContext.subject}:

CONTEXTO:
- Materia: ${input.documentContext.subject}
- Nivel académico: ${input.documentContext.academicLevel}
- Temas principales: ${input.documentContext.mainTopics.join(', ')}

CONCEPTOS A ANALIZAR:
${JSON.stringify(input.concepts, null, 2)}

PREGUNTAS ASOCIADAS:
${JSON.stringify(input.questions.map(q => ({
                            id: q.id,
                            question: q.question,
                            conceptId: q.conceptId,
                            qualityScore: q.qualityScore
                        })), null, 2)}

TAREAS A REALIZAR:

1. **IDENTIFICAR RELACIONES**: Analiza cómo se relacionan los conceptos entre sí:
   - Prerequisitos: ¿Qué conceptos deben entenderse antes que otros?
   - Soporte: ¿Qué conceptos ayudan a entender otros?
   - Similitudes y contrastes
   - Aplicaciones y ejemplos
   - Jerarquías parte-todo

2. **CREAR CLUSTERS**: Agrupa conceptos relacionados en clusters lógicos:
   - Identifica el concepto central de cada cluster
   - Estima la dificultad y tiempo de estudio
   - Nombra y describe cada cluster

3. **DISEÑAR RUTAS DE APRENDIZAJE**: Crea secuencias de aprendizaje óptimas:
   - Considera prerequisitos y dependencias
   - Progresión lógica de dificultad
   - Minimiza saltos conceptuales abruptos
   - Maximiza la construcción incremental del conocimiento

4. **GENERAR RECOMENDACIONES**: Proporciona recomendaciones de estudio:
   - Mejores puntos de partida
   - Conceptos prerequisitos para cada tema
   - Progresión por niveles de dificultad

5. **IDENTIFICAR INSIGHTS**: Encuentra patrones importantes:
   - Conceptos fundacionales clave
   - Conceptos más conectados (hubs)
   - Posibles cuellos de botella en el aprendizaje
   - Conceptos que podrían estar faltando

CRITERIOS DE CALIDAD:
- Las relaciones deben ser pedagógicamente válidas
- Las secuencias deben ser progresivas y lógicas
- Los clusters deben ser coherentes temáticamente
- Los tiempos estimados deben ser realistas para el nivel académico
- Las recomendaciones deben ser prácticas y aplicables`
                    }
                ]
            }
        ],
        model: 'googleai/gemini-2.5-flash-lite',
        output: {
            schema: MapConceptRelationshipsOutputSchema,
            format: 'json'
        },
        config: {
            temperature: 0.2,
            maxOutputTokens: 16384
        },
    });
    if (!(response === null || response === void 0 ? void 0 : response.output)) {
        throw new Error('Failed to map concept relationships.');
    }
    return response.output;
});
export async function mapConceptRelationships(input) {
    return mapConceptRelationshipsFlow(input);
}
