'use server';

/**
 * @fileOverview Generates a flashcard deck from a blob of text, a PDF, HTML, or one or more images using a multi-agent pipeline approach.
 *
 * - generateDeckFromText - A function that generates a flashcard deck.
 */

import { ai } from '@/ai/genkit';
import { GenerateDeckFromTextInputSchema, GenerateDeckFromTextOutputSchema, type GenerateDeckFromTextInput, type GenerateDeckFromTextOutput } from '@/types';


export async function generateDeckFromText(input: GenerateDeckFromTextInput): Promise<GenerateDeckFromTextOutput> {
  return generateDeckFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeckFromTextPrompt',
  input: { schema: GenerateDeckFromTextInputSchema },
  output: { schema: GenerateDeckFromTextOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are an orchestrated AI system composed of specialized agents. Your mission is to convert raw study material into a high-quality, structured knowledge graph and then into a flashcard deck. You will perform your roles sequentially.

The final output MUST be entirely in Spanish.

**Material de Estudio de Entrada:**
{{#if studyNotesIsArray}}
  {{#each studyNotes}}
    {{media url=this}}
  {{/each}}
{{else}}
  {{#if studyNotesIsDataUri}}
    {{media url=studyNotes}}
  {{else}}
    {{{studyNotes}}}
  {{/if}}
{{/if}}

---
**PIPELINE DE PROCESAMIENTO:**

**Paso 1: Agente Extractor (El Explorador)**
Tu primera tarea. Actúa como un experto en extracción de entidades. Lee el material de estudio y extrae una lista exhaustiva de todos los conceptos, definiciones, fórmulas, fechas y términos clave.
-   **Acción:** Genera una lista interna de entidades candidatas.

**Paso 2: Agente Relacionador (El Cartógrafo)**
Ahora, analiza el texto original y las entidades que extrajiste. Tu misión es identificar las relaciones contextuales y de dependencia entre ellas.
-   **Acción:** Determina qué entidades son prerrequisitos para otras. Esta información se usará para el campo 'atomos_padre'. Un átomo fundamental no tendrá padres.

**Paso 3: Agente Generador de Átomos (El Armero)**
Con las entidades y sus relaciones, convierte cada entidad en un "Átomo de Conocimiento" formal.
-   **Acción:** Para cada entidad, genera la siguiente estructura detallada:
    -   **atomo_id**: Un ID único para el átomo (e.g., "ALG023").
    -   **material_id**: Un ID para todo el mazo (e.g., 'MAT001').
    -   **concepto**: La pregunta, clara y concisa.
    -   **descripcion**: La respuesta, precisa y completa. Usa Markdown y LaTeX si es necesario.
    -   **atomos_padre**: El array de 'atomo_id's que identificaste en el Paso 2.
    -   **formatos_presentacion**: Elige formatos adecuados del array: ["Identificación", "Ejemplificación", "Comparación", "Causa y Efecto", "Procedimiento"].
    -   **dificultad_inicial**: Clasifica la dificultad: "Fundamental", "Intermedio", "Avanzado", "Específico".

**Paso 4: Agente Validador (El Inspector de Calidad)**
Revisa todo tu trabajo. ¿Hay conceptos duplicados o redundantes? ¿Las relaciones ('atomos_padre') son lógicas? ¿Son las preguntas y respuestas claras y concisas? ¿Se ha cubierto todo el material relevante?
-   **Acción:** Realiza una autocrítica y refina el conjunto de átomos. Si encuentras un problema, corrígelo antes de generar el output final. Asegúrate de que no haya información perdida o mal interpretada.

**Paso 5: Generación Final**
Después de la validación, genera un título y descripción para el mazo y ensambla el JSON final.

Tu output final MUST be a JSON object that follows this schema:
\`\`\`json
${JSON.stringify(GenerateDeckFromTextOutputSchema.shape, null, 2)}
\`\`\`
`,
});

const generateDeckFromTextFlow = ai.defineFlow(
  {
    name: 'generateDeckFromTextFlow',
    inputSchema: GenerateDeckFromTextInputSchema,
    outputSchema: GenerateDeckFromTextOutputSchema,
  },
  async ({ studyNotes }) => {
    const isArray = Array.isArray(studyNotes);
    const isDataUri = typeof studyNotes === 'string' && studyNotes.startsWith('data:');

    const promptInput = {
      studyNotes: studyNotes,
      studyNotesIsArray: isArray,
      studyNotesIsDataUri: isDataUri,
    };

    const { output } = await prompt(promptInput);
    return output!;
  }
);
