/**
 * @fileOverview Direct atom generation from document content with proper debugging.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import pdfParse from 'pdf-parse';
const GenerateAtomsInputSchema = z.object({
    studyMaterial: z
        .string()
        .describe('The study material to be atomized, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'),
    userPreferences: z.object({
        availableTimePerSession: z.number().default(30).describe('Minutes available per study session'),
        totalAvailableTime: z.number().default(300).describe('Total available study time in minutes'),
        learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']).optional(),
        difficultyPreference: z.enum(['gradual', 'challenging', 'mixed']).default('gradual'),
    }).optional().describe('User study preferences'),
});
const GenerateAtomsOutputSchema = z.object({
    initialResponse: z.string().describe('A conversational, welcoming response to the user.'),
    pipeline: z.object({
        documentContext: z.any().describe('Document analysis results'),
        concepts: z.any().describe('Extracted concepts'),
        questions: z.any().describe('Generated questions'),
        conceptMap: z.any().describe('Concept relationships'),
        studyPlan: z.any().describe('KoLearning study plan'),
        rawContent: z.string().optional().describe('The raw text content extracted from the document'),
    }).describe('Complete pipeline results'),
    atoms: z.array(z.object({
        question: z.string().describe('The question generated from the study material.'),
        answer: z.string().describe('The answer to the question.'),
        incorrectAnswers: z.array(z.string()).optional().describe('An array of plausible incorrect answers (distractors).')
    })).describe('Questions converted to legacy atom format for compatibility.'),
});
export const generateAtomsFlow = ai.defineFlow({
    name: 'generateAtomsFromLargeContentWithProgress',
    inputSchema: GenerateAtomsInputSchema,
    outputSchema: GenerateAtomsOutputSchema,
    streamSchema: z.object({
        stage: z.string(),
        message: z.string(),
        details: z.string().optional(),
        progress: z.number()
    }).optional()
}, async (input) => {
    return generateAtomsFromLargeContentWithProgress(input, () => { });
});
export async function generateAtoms(input) {
    return generateAtomsFromLargeContentWithProgress(input, () => { });
}
export async function generateAtomsFromLargeContent(input) {
    return generateAtomsFromLargeContentWithProgress(input, () => { });
}
export async function generateAtomsFromLargeContentWithProgress(input, onProgress) {
    var _a, _b;
    // Debug logging for input
    console.log('=== DEBUGGING INPUT ===');
    console.log('Input data URI length:', input.studyMaterial.length);
    console.log('Data URI prefix:', input.studyMaterial.substring(0, 50));
    // For PDFs, we'll pass the data URI directly to AI instead of decoding
    const dataURIPattern = /^data:([^;]+);base64,(.+)$/;
    const matches = input.studyMaterial.match(dataURIPattern);
    if (!matches) {
        throw new Error('Formato de data URI inválido');
    }
    const [, mimeType] = matches;
    console.log('Detected MIME type:', mimeType);
    let content;
    let isPDF = false;
    if (mimeType.includes('pdf')) {
        console.log('PDF detected - extracting text via pdf-parse');
        const base64 = matches[2];
        const buffer = Buffer.from(base64, 'base64');
        const parsed = await pdfParse(buffer);
        content = parsed.text || '';
        isPDF = true;
    }
    else {
        console.log('Text file detected - decoding content');
        content = decodeDataURI(input.studyMaterial);
        console.log('=== DEBUGGING CONTENT DECODING ===');
        console.log('Decoded content length:', content.length);
        console.log('Content preview (first 500 chars):', content.substring(0, 500));
        console.log('Content preview (last 200 chars):', content.substring(Math.max(0, content.length - 200)));
        if (!content || content.length < 10) {
            throw new Error('Contenido del documento vacío o demasiado corto');
        }
    }
    // Etapa 3: Generación de Átomos
    onProgress({
        stage: 'generating_atoms',
        message: '🧠 Generando átomos de conocimiento...',
        details: `Iniciando análisis semántico del documento`,
        progress: 40
    });
    try {
        console.log('=== STARTING ATOMS GENERATION ===');
        // Using a fallback empty context since we generate metadata later
        const fallbackContext = { subject: "Documento General", academicLevel: "General" };
        const atomsResult = await generateAtomsInChunks(content, fallbackContext, onProgress);
        console.log('=== ATOMS GENERATION COMPLETE ===');
        console.log('Atoms result:', atomsResult.atoms.length, 'atoms');
        // Etapa 5: Generate distractors for atoms that are missing them
        const atomsMissingDistractors = atomsResult.atoms.filter(a => !a.incorrectAnswers || a.incorrectAnswers.length === 0);
        if (atomsMissingDistractors.length > 0) {
            onProgress({
                stage: 'generating_distractors',
                message: '🎯 Generando opciones de respuesta...',
                details: `Creando distractores para ${atomsMissingDistractors.length} átomos`,
                progress: 75
            });
            console.log(`=== GENERATING DISTRACTORS FOR ${atomsMissingDistractors.length} ATOMS ===`);
            // Generate distractors in batch via a single AI call for efficiency
            try {
                const batchDistractors = await generateDistractorsBatch(atomsMissingDistractors.map(a => ({ question: a.question, answer: a.answer })), fallbackContext.subject);
                // Merge distractors back into atoms
                let distractorIndex = 0;
                for (const atom of atomsResult.atoms) {
                    if (!atom.incorrectAnswers || atom.incorrectAnswers.length === 0) {
                        atom.incorrectAnswers = batchDistractors[distractorIndex] || [
                            'Opción incorrecta A',
                            'Opción incorrecta B',
                            'Opción incorrecta C'
                        ];
                        distractorIndex++;
                    }
                }
                console.log('=== DISTRACTORS GENERATED SUCCESSFULLY ===');
            }
            catch (error) {
                console.warn('Batch distractor generation failed, using simple fallbacks:', error);
                // Fallback: create simple distractors for atoms that don't have them
                for (const atom of atomsResult.atoms) {
                    if (!atom.incorrectAnswers || atom.incorrectAnswers.length === 0) {
                        atom.incorrectAnswers = [
                            `No es correcto: variación de "${atom.answer.substring(0, 30)}..."`,
                            'Esta opción es incorrecta',
                            'Ninguna de las anteriores aplica'
                        ];
                    }
                }
            }
        }
        // Etapa 6: Inferencia de Título y Metadatos a partir de los Átomos Generados
        onProgress({
            stage: 'analyzing_context',
            message: '📄 Infiriendo metadatos del proyecto...',
            details: `> Resumiendo temática general a partir de ${atomsResult.atoms.length} conceptos extraídos`,
            progress: 90
        });
        let documentContext;
        try {
            console.log('=== STARTING DEFERRED CONTEXT ANALYSIS ===');
            // Takes a sample of up to 15 atoms to infer the general title and description
            const atomSample = atomsResult.atoms.slice(0, 15);
            documentContext = await analyzeDocumentContextUnified(atomSample, onProgress);
            console.log('=== DEFERRED CONTEXT ANALYSIS COMPLETE ===');
            console.log('Document context result:', documentContext);
        }
        catch (error) {
            console.error('Error analyzing deferred document context:', error);
            documentContext = {
                inferredTitle: "Proyecto de Estudio",
                inferredDescription: `Proyecto generado a partir de ${atomsResult.atoms.length} átomos.`,
                subject: "General",
                academicLevel: "undergraduate",
                categories: ["General"],
                documentType: "other"
            };
        }
        onProgress({
            stage: 'finalizing',
            message: '✅ Finalizando átomos de conocimiento...',
            details: `${atomsResult.atoms.length} átomos con opciones de respuesta`,
            progress: 90
        });
        const result = {
            initialResponse: `¡Hola! He procesado tu documento de ${documentContext.subject} y extraído ${atomsResult.atoms.length} átomos de conocimiento relevantes del contenido específico que subiste.`,
            pipeline: {
                documentContext,
                concepts: { extracted: atomsResult.atoms.length },
                questions: { generated: atomsResult.atoms.length },
                qualityReport: { approved: atomsResult.atoms.length },
                conceptMap: { relationships: 0 },
                studyPlan: { sessions: 0 },
                rawContent: content
            },
            atoms: atomsResult.atoms
        };
        console.log('=== FINAL RESULT STRUCTURE ===');
        console.log('Has pipeline?', !!result.pipeline);
        console.log('Has documentContext?', !!((_a = result.pipeline) === null || _a === void 0 ? void 0 : _a.documentContext));
        console.log('Document context keys:', Object.keys(((_b = result.pipeline) === null || _b === void 0 ? void 0 : _b.documentContext) || {}));
        return result;
    }
    catch (error) {
        console.error('Error generating atoms:', error);
        throw new Error(`Error al generar átomos del documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
}
/*
// The original function is kept below for reference, but is not currently used.

// Main function with progress tracking
async function originalGenerateAtomsFromLargeContentWithProgress(
  input: GenerateAtomsInput,
  onProgress: (progress: any) => void
): Promise<GenerateAtomsOutput> {
  // Debug logging for input
  console.log('=== DEBUGGING INPUT ===');
  console.log('Input data URI length:', input.studyMaterial.length);
  console.log('Data URI prefix:', input.studyMaterial.substring(0, 50));

  // For PDFs, we'll pass the data URI directly to AI instead of decoding
  const dataURIPattern = /^data:([^;]+);base64,(.+)$/;
  const matches = input.studyMaterial.match(dataURIPattern);

  if (!matches) {
    throw new Error('Formato de data URI inválido');
  }

  const [, mimeType] = matches;
  console.log('Detected MIME type:', mimeType);

  let content: string;
  let isPDF = false;

  if (mimeType.includes('pdf')) {
    console.log('PDF detected - extracting text via pdf-parse');
    const base64 = matches[2];
    const buffer = Buffer.from(base64, 'base64');
    const parsed = await pdfParse(buffer);
    content = parsed.text || '';
    isPDF = true;
  } else {
    console.log('Text file detected - decoding content');
    content = decodeDataURI(input.studyMaterial);

    console.log('=== DEBUGGING CONTENT DECODING ===');
    console.log('Decoded content length:', content.length);
    console.log('Content preview (first 500 chars):', content.substring(0, 500));
    console.log('Content preview (last 200 chars):', content.substring(Math.max(0, content.length - 200)));

    if (!content || content.length < 10) {
      throw new Error('Contenido del documento vacío o demasiado corto');
    }
  }

  // Etapa 3: Análisis de Contexto Unificado (título, tema, nivel, estructura)
  onProgress({
    stage: 'analyzing_context',
    message: '📄 Analizando contexto del documento...',
    details: `Identificando tema, título y estructura del documento`,
    progress: 10
  });

  let documentContext;
  try {
    console.log('=== STARTING CONTEXT ANALYSIS ===');
    documentContext = await analyzeDocumentContextUnified(content, isPDF, onProgress);
    console.log('=== CONTEXT ANALYSIS COMPLETE ===');
    console.log('Document context result:', documentContext);
  } catch (error) {
    console.error('Error analyzing document context:', error);
    console.error('Full error details:', error);
    throw new Error(`Error crítico en análisis de contexto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }

  // Etapa 4: Generación de Átomos con Contexto
  onProgress({
    stage: 'generating_atoms',
    message: '🧠 Generando átomos basados en el contexto...',
    details: `Extrayendo contenido educativo de ${documentContext.subject}`,
    progress: 40
  });

  try {
    console.log('=== STARTING ATOMS GENERATION ===');
    const atomsResult = await generateAtomsInChunks(content, documentContext, onProgress);
    console.log('=== ATOMS GENERATION COMPLETE ===');
    console.log('Atoms result:', atomsResult.atoms.length, 'atoms');

    const result = {
      initialResponse: `¡Hola! He procesado tu documento de ${documentContext.subject} y extraído ${atomsResult.atoms.length} átomos de conocimiento relevantes del contenido específico que subiste.`,
      pipeline: {
        documentContext,
        concepts: { extracted: atomsResult.atoms.length },
        questions: { generated: atomsResult.atoms.length },
        qualityReport: { approved: atomsResult.atoms.length },
        conceptMap: { relationships: 0 },
        studyPlan: { sessions: 0 },
      },
      atoms: atomsResult.atoms
    };

    console.log('=== FINAL RESULT STRUCTURE ===');
    console.log('Has pipeline?', !!result.pipeline);
    console.log('Has documentContext?', !!result.pipeline?.documentContext);
    console.log('Document context keys:', Object.keys(result.pipeline?.documentContext || {}));

    return result;

  } catch (error) {
    console.error('Error generating atoms:', error);
    throw new Error(`Error al generar átomos del documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
*/
// The original function is kept below for reference, but is not currently used.
/*
async function originalGenerateAtomsFromLargeContentWithProgress(
  input: GenerateAtomsInput,
  onProgress: (progress: any) => void
): Promise<GenerateAtomsOutput> {
  // Debug logging for input
  console.log('=== DEBUGGING INPUT ===');
  console.log('Input data URI length:', input.studyMaterial.length);
  console.log('Data URI prefix:', input.studyMaterial.substring(0, 50));

  // For PDFs, we'll pass the data URI directly to AI instead of decoding
  const dataURIPattern = /^data:([^;]+);base64,(.+)$/;
  const matches = input.studyMaterial.match(dataURIPattern);

  if (!matches) {
    throw new Error('Formato de data URI inválido');
  }

  const [, mimeType] = matches;
  console.log('Detected MIME type:', mimeType);

  let content: string;
  let isPDF = false;

  if (mimeType.includes('pdf')) {
    console.log('PDF detected - extracting text via pdf-parse');
    const base64 = matches[2];
    const buffer = Buffer.from(base64, 'base64');
    const parsed = await pdfParse(buffer);
    content = parsed.text || '';
    isPDF = true;
  } else {
    console.log('Text file detected - decoding content');
    content = decodeDataURI(input.studyMaterial);

    console.log('=== DEBUGGING CONTENT DECODING ===');
    console.log('Decoded content length:', content.length);
    console.log('Content preview (first 500 chars):', content.substring(0, 500));
    console.log('Content preview (last 200 chars):', content.substring(Math.max(0, content.length - 200)));

    if (!content || content.length < 10) {
      throw new Error('Contenido del documento vacío o demasiado corto');
    }
  }

  // Etapa 3: Análisis de Contexto Unificado (título, tema, nivel, estructura)
  onProgress({
    stage: 'analyzing_context',
    message: '📄 Analizando contexto del documento...',
    details: `Identificando tema, título y estructura del documento`,
    progress: 10
  });

  let documentContext;
  try {
    console.log('=== STARTING CONTEXT ANALYSIS ===');
    documentContext = await analyzeDocumentContextUnified(content, isPDF, onProgress);
    console.log('=== CONTEXT ANALYSIS COMPLETE ===');
    console.log('Document context result:', documentContext);
  } catch (error) {
    console.error('Error analyzing document context:', error);
    console.error('Full error details:', error);
    throw new Error(`Error crítico en análisis de contexto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }

  // Etapa 4: Generación de Átomos con Contexto
  onProgress({
    stage: 'generating_atoms',
    message: '🧠 Generando átomos basados en el contexto...',
    details: `Extrayendo contenido educativo de ${documentContext.subject}`,
    progress: 40
  });

  try {
    console.log('=== STARTING ATOMS GENERATION ===');
    const atomsResult = await generateAtomsInChunks(content, documentContext, onProgress);
    console.log('=== ATOMS GENERATION COMPLETE ===');
    console.log('Atoms result:', atomsResult.atoms.length, 'atoms');

    const result = {
      initialResponse: `¡Hola! He procesado tu documento de ${documentContext.subject} y extraído ${atomsResult.atoms.length} átomos de conocimiento relevantes del contenido específico que subiste.`,
      pipeline: {
        documentContext,
        concepts: { extracted: atomsResult.atoms.length },
        questions: { generated: atomsResult.atoms.length },
        qualityReport: { approved: atomsResult.atoms.length },
        conceptMap: { relationships: 0 },
        studyPlan: { sessions: 0 },
      },
      atoms: atomsResult.atoms
    };

    console.log('=== FINAL RESULT STRUCTURE ===');
    console.log('Has pipeline?', !!result.pipeline);
    console.log('Has documentContext?', !!result.pipeline?.documentContext);
    console.log('Document context keys:', Object.keys(result.pipeline?.documentContext || {}));

    return result;

  } catch (error) {
    console.error('Error generating atoms:', error);
    throw new Error(`Error al generar átomos del documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
*/
// Batch distractor generation - generates distractors for multiple atoms in one AI call
async function generateDistractorsBatch(atoms, subject) {
    var _a;
    console.log(`=== BATCH DISTRACTOR GENERATION: ${atoms.length} atoms ===`);
    // Process in chunks of 15 to avoid token limits
    const chunkSize = 15;
    const allDistractors = [];
    for (let i = 0; i < atoms.length; i += chunkSize) {
        const chunk = atoms.slice(i, i + chunkSize);
        const atomsList = chunk.map((a, idx) => `${idx + 1}. Pregunta: "${a.question}"\n   Respuesta correcta: "${a.answer}"`).join('\n\n');
        const batchPrompt = `Eres un experto en ${subject} creando contenido educativo.
Para cada pregunta y respuesta correcta a continuación, genera EXACTAMENTE 3 opciones de respuesta incorrectas pero plausibles (distractores).
Los distractores deben ser conceptos relacionados que un estudiante podría confundir con la respuesta correcta.

${atomsList}

FORMATO DE RESPUESTA (JSON):
{
  "distractors": [
    ["distractor1_para_pregunta1", "distractor2_para_pregunta1", "distractor3_para_pregunta1"],
    ["distractor1_para_pregunta2", "distractor2_para_pregunta2", "distractor3_para_pregunta2"]
  ]
}

IMPORTANTE: El array "distractors" debe tener EXACTAMENTE ${chunk.length} sub-arrays, uno por cada pregunta, en el MISMO orden.`;
        try {
            const response = await ai.generate({
                prompt: batchPrompt,
                model: 'googleai/gemini-2.5-flash',
                output: {
                    schema: z.object({
                        distractors: z.array(z.array(z.string()))
                    }),
                    format: 'json'
                },
                config: {
                    temperature: 0.3,
                    maxOutputTokens: 8192
                },
            });
            if ((_a = response === null || response === void 0 ? void 0 : response.output) === null || _a === void 0 ? void 0 : _a.distractors) {
                // Ensure each entry has exactly 3 distractors
                for (const d of response.output.distractors) {
                    while (d.length < 3)
                        d.push('Opción incorrecta');
                    allDistractors.push(d.slice(0, 3));
                }
                // Fill in any missing entries
                while (allDistractors.length < i + chunk.length) {
                    allDistractors.push(['Opción A incorrecta', 'Opción B incorrecta', 'Opción C incorrecta']);
                }
            }
            else {
                // Fill with defaults for this chunk
                for (let j = 0; j < chunk.length; j++) {
                    allDistractors.push(['Opción A incorrecta', 'Opción B incorrecta', 'Opción C incorrecta']);
                }
            }
        }
        catch (error) {
            console.warn(`Batch distractor generation failed for chunk ${i / chunkSize + 1}:`, error);
            for (let j = 0; j < chunk.length; j++) {
                allDistractors.push(['Opción A incorrecta', 'Opción B incorrecta', 'Opción C incorrecta']);
            }
        }
    }
    console.log(`=== BATCH DISTRACTORS COMPLETE: ${allDistractors.length} sets ===`);
    return allDistractors;
}
// Análisis de contexto unificado basado en los átomos de conocimiento generados
export async function analyzeDocumentContextUnified(atoms, onProgress) {
    console.log('=== ANALYZING UNIFIED DOCUMENT CONTEXT FROM ATOMS ===');
    console.log('Atoms sampled for context:', atoms.length);
    onProgress({
        stage: 'context_analysis',
        message: '🔍 Infiriendo título y materia...',
        details: 'Generando metadatos estructurados a partir de los átomos',
        progress: 90
    });
    try {
        const atomsPreview = atoms.map((a, i) => `[${i}] P: ${a.question}\nR: ${a.answer}`).join('\n\n');
        const prompt = `Analiza la siguiente muestra de conocimientos (Pregunta y Respuesta) extraídos de un documento de estudio, y con base ÚNICAMENTE en ellos infiere:

1. Título principal representativo del tema general (Máximo 7 palabras, directo y claro)
2. Descripción breve de lo que cubre el conocimiento (1-2 oraciones)
3. Campo de estudio o materia principal
4. Nivel académico apropiado
5. Categorías relevantes (máximo 3)
6. Tipo de documento original probable

REGLA CRÍTICA PARA EL TÍTULO: 
ESTÁ ESTRICTAMENTE PROHIBIDO usar títulos genéricos o comodines como "Documento Analizado", "Proyecto de Estudio", "Documento", "Notas", etc. DEBES inferir el tema o concepto central OBLIGATORIAMENTE basándote en el contenido real de los átomos. Por ejemplo, si los átomos hablan de la revolución francesa, el título DEBE ser "Revolución Francesa", NO "Documento de Historia".

MUESTRA DE CONOCIMIENTO (ÁTOMOS):
${atomsPreview}

FORMATO DE RESPUESTA (JSON):
{
  "inferredTitle": "Título inferido del tema específico",
  "inferredDescription": "Descripción breve",
  "subject": "Campo de estudio",
  "academicLevel": "undergraduate",
  "categories": ["categoría1", "categoría2"],
  "documentType": "other"
}

Usa únicamente estos valores para academicLevel: elementary, high_school, undergraduate, graduate, professional
Usa únicamente estos valores para documentType: academic_paper, textbook, manual, lecture_notes, article, other`;
        const response = await ai.generate({
            prompt,
            model: 'googleai/gemini-2.5-flash',
            output: {
                schema: z.object({
                    inferredTitle: z.string().min(1).optional(),
                    inferredDescription: z.string().min(1).optional(),
                    subject: z.string().min(1).optional(),
                    academicLevel: z.enum(['elementary', 'high_school', 'undergraduate', 'graduate', 'professional']).optional(),
                    categories: z.array(z.string()).min(1).max(3).optional(),
                    documentType: z.enum(['academic_paper', 'textbook', 'manual', 'lecture_notes', 'article', 'other']).optional()
                }),
                format: 'json'
            },
            config: {
                temperature: 0.1,
                maxOutputTokens: 1024
            },
        });
        console.log('=== CONTEXT ANALYSIS RESPONSE RECEIVED ===');
        console.log('Response exists?', !!response);
        console.log('Output exists?', !!(response === null || response === void 0 ? void 0 : response.output));
        const result = response === null || response === void 0 ? void 0 : response.output;
        // Provide sensible defaults if fields are missing or if generation was cut off
        // We intentionally make the fallback title more generic if the AI completely failed
        const finalResult = {
            inferredTitle: (result === null || result === void 0 ? void 0 : result.inferredTitle) || "Proyecto de Estudio",
            inferredDescription: (result === null || result === void 0 ? void 0 : result.inferredDescription) || "Documento de estudio procesado automáticamente.",
            subject: (result === null || result === void 0 ? void 0 : result.subject) || "Estudio General",
            academicLevel: (result === null || result === void 0 ? void 0 : result.academicLevel) || "undergraduate",
            categories: (result === null || result === void 0 ? void 0 : result.categories) && result.categories.length > 0 ? result.categories : ["General"],
            documentType: (result === null || result === void 0 ? void 0 : result.documentType) || "other"
        };
        console.log('Document context verified successfully with possible fallbacks:', finalResult);
        return finalResult;
    }
    catch (error) {
        console.error('Error in analyzeDocumentContextUnified, returning safe fallback context to prevent process failure:', error);
        // Graceful fallback to avoid breaking the entire project creation process
        // if AI safety filters or context length issues occur.
        return {
            inferredTitle: "Documento Analizado",
            inferredDescription: "Documento de estudio revisado con opciones limitadas debido a filtros de contenido.",
            subject: "Estudio General",
            academicLevel: "undergraduate",
            categories: ["Extendido", "General"],
            documentType: "other"
        };
    }
}
// Generación de átomos con contexto previo (o sin él)
async function generateAtomsWithContext(content, isPDF, documentContext, onProgress) {
    var _a, _b;
    console.log('=== GENERATE ATOMS START ===');
    console.log('isPDF:', isPDF);
    console.log('documentContext:', documentContext);
    console.log('content length:', content.length);
    const contentSlice = content.length > 50000 ? content.substring(0, 50000) + '...' : content;
    const ctxSubject = (documentContext === null || documentContext === void 0 ? void 0 : documentContext.subject) || "Documento General";
    const ctxLevel = (documentContext === null || documentContext === void 0 ? void 0 : documentContext.academicLevel) || "General";
    onProgress({
        stage: 'extracting_with_context',
        message: '🧠 Extrayendo conceptos principales...',
        details: `> Inicializando módulo de extracción semántica...\n> Configurando filtros de descarte...\n> Leyendo fragmento de ${contentSlice.length} caracteres...\n> Buscando conceptos clave y relaciones estructurales...`,
        progress: 40
    });
    const atomsPrompt = `Eres un experto educativo que extrae preguntas específicas del contenido proporcionado. Debes crear preguntas ÚNICAMENTE sobre el núcleo informativo y conceptual del texto.

CONTEXTO CONOCIDO:
- Tema: ${ctxSubject}
- Nivel: ${ctxLevel}

CONTENIDO:
${contentSlice}

INSTRUCCIONES ESPECÍFICAS DE EXTRACCIÓN Y CALIDAD:
1. IGNORA ABSOLUTAMENTE las siguientes secciones (no generes preguntas sobre ellas):
   - Índices, tablas de contenido y glosarios estructurados.
   - Bibliografía, referencias a autores, citas académicas y listados de referencias.
   - Agradecimientos, dedicatorias, introducciones genéricas y texto de relleno o administrativo.
   - Metadatos del archivo, números de página, encabezados repetitivos o notas al pie irrelevantes.
2. ENFÓCATE EXCLUSIVAMENTE en el contenido didáctico central:
   - Conceptos clave, definiciones fundamentales, procesos, fórmulas, fechas históricas críticas y relaciones conceptuales importantes de ${documentContext.subject}.
3. CALIDAD SOBRE CANTIDAD, PERO SIENDO EXHAUSTIVO:
   - Extrae todos los conceptos importantes presentes en el texto, sin importar si resultan en un número alto de preguntas.
   - Sin embargo, NO sacrifiques la calidad. Cada átomo (pregunta/respuesta) debe condesar un tema principal de forma eficaz, directa y sin ambigüedades.
   - Si un párrafo o sección no contiene información educativa valiosa o principal, ignóralo por completo.
4. Nivel de dificultad adecuado para: ${documentContext.academicLevel}. Asegúrate de que las explicaciones sean claras y concisas.

FORMATO DE RESPUESTA (JSON):
{
  "atoms": [
    { "question": "...", "answer": "..." }
  ]
}`;
    console.log('=== SENDING AI REQUEST ===');
    const response = await ai.generate({
        prompt: atomsPrompt,
        model: 'googleai/gemini-2.5-flash',
        output: {
            schema: z.object({
                atoms: z.array(z.object({
                    question: z.string(),
                    answer: z.string()
                }))
            }),
            format: 'json'
        },
        config: {
            temperature: 0.1,
            maxOutputTokens: 32768
        },
    });
    console.log('=== AI RESPONSE RECEIVED ===');
    console.log('Response exists?', !!response);
    console.log('Output exists?', !!(response === null || response === void 0 ? void 0 : response.output));
    console.log('Atoms count:', ((_b = (_a = response === null || response === void 0 ? void 0 : response.output) === null || _a === void 0 ? void 0 : _a.atoms) === null || _b === void 0 ? void 0 : _b.length) || 0);
    // Robust validation of the AI model's response
    if (!(response === null || response === void 0 ? void 0 : response.output) || !Array.isArray(response.output.atoms)) {
        console.error('CRITICAL: AI response is missing or `atoms` is not an array.', response);
        throw new Error('El modelo no devolvió una estructura de átomos válida.');
    }
    // Filter for valid and non-empty atoms
    const validAtoms = response.output.atoms.filter((atom, index) => {
        var _a, _b;
        if (!atom) {
            console.warn(`Skipping null or undefined atom at index ${index}.`);
            return false;
        }
        const isValid = atom.question && atom.answer &&
            atom.question.trim().length > 10 &&
            atom.answer.trim().length > 1;
        if (!isValid) {
            console.warn('Invalid atom filtered out:', {
                question: atom.question,
                answer: atom.answer,
                reason: `Question length: ${(_a = atom.question) === null || _a === void 0 ? void 0 : _a.trim().length}, Answer length: ${(_b = atom.answer) === null || _b === void 0 ? void 0 : _b.trim().length}`
            });
        }
        return isValid;
    });
    console.log(`=== ATOMS FILTERING COMPLETE ===`);
    console.log(`Original atoms count from model: ${response.output.atoms.length}`);
    console.log(`Valid atoms after filtering: ${validAtoms.length}`);
    return { atoms: validAtoms };
}
// Function to process content in chunks to ensure full coverage
async function generateAtomsInChunks(content, documentContext, onProgress) {
    const CHUNK_SIZE = 35000;
    const OVERLAP = 3000;
    const totalLength = content.length;
    if (totalLength <= CHUNK_SIZE + OVERLAP) {
        return generateAtomsWithContext(content, false, documentContext, onProgress);
    }
    console.log(`=== PROCESSING CONTENT IN CHUNKS: ${totalLength} characters ===`);
    const chunks = [];
    for (let i = 0; i < totalLength; i += (CHUNK_SIZE - OVERLAP)) {
        chunks.push(content.substring(i, i + CHUNK_SIZE));
        if (i + CHUNK_SIZE >= totalLength)
            break;
    }
    console.log(`Split into ${chunks.length} chunks`);
    let allAtoms = [];
    for (let i = 0; i < chunks.length; i++) {
        onProgress({
            stage: 'extracting_chunks',
            message: `🧠 Procesando bloque ${i + 1} de ${chunks.length}...`,
            details: `> Cargando bloque en memoria de contexto (tamaño: ${chunks[i].length} tokens)...\n> Integridad del contexto principal: Activa.\n> Escaneando conceptos técnicos y relaciones semánticas...\n> Generando sub-átomos...`,
            progress: 40 + Math.round((i / chunks.length) * 30)
        });
        try {
            const result = await generateAtomsWithContext(chunks[i], false, documentContext, () => { });
            allAtoms = [...allAtoms, ...result.atoms];
            console.log(`Chunk ${i + 1} produced ${result.atoms.length} atoms. Total so far: ${allAtoms.length}`);
        }
        catch (error) {
            console.warn(`Error in chunk ${i + 1}, skipping:`, error);
        }
    }
    // Basic deduplication based on normalized question text
    const seenQuestions = new Set();
    const uniqueAtoms = allAtoms.filter(atom => {
        const normalized = atom.question.toLowerCase().trim().replace(/[?¿!¡]/g, '');
        if (seenQuestions.has(normalized))
            return false;
        seenQuestions.add(normalized);
        return true;
    });
    console.log(`=== CHUNK PROCESSING COMPLETE ===`);
    console.log(`Original total: ${allAtoms.length}, Unique after deduplication: ${uniqueAtoms.length}`);
    return { atoms: uniqueAtoms };
}
// Function to decode data URI for text files only
function decodeDataURI(dataURI) {
    try {
        const dataURIPattern = /^data:([^;]+);base64,(.+)$/;
        const matches = dataURI.match(dataURIPattern);
        if (!matches) {
            throw new Error('Invalid data URI format');
        }
        const [, , base64Data] = matches;
        // Decode as UTF-8 text
        const decodedContent = Buffer.from(base64Data, 'base64').toString('utf-8');
        console.log('Text file decoded, length:', decodedContent.length);
        return decodedContent;
    }
    catch (error) {
        console.error('Error decoding data URI:', error);
        throw new Error('Failed to decode study material');
    }
}
