/**
 * @fileOverview Direct atom generation from document content with proper debugging.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import pdfParse from 'pdf-parse';

const GenerateAtomsInputSchema = z.object({
  studyMaterial: z
    .string()
    .describe(
      'The study material to be atomized, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  userPreferences: z.object({
    availableTimePerSession: z.number().default(30).describe('Minutes available per study session'),
    totalAvailableTime: z.number().default(300).describe('Total available study time in minutes'),
    learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']).optional(),
    difficultyPreference: z.enum(['gradual', 'challenging', 'mixed']).default('gradual'),
  }).optional().describe('User study preferences'),
});
export type GenerateAtomsInput = z.infer<typeof GenerateAtomsInputSchema>;

const GenerateAtomsOutputSchema = z.object({
  initialResponse: z.string().describe('A conversational, welcoming response to the user.'),
  pipeline: z.object({
    documentContext: z.any().describe('Document analysis results'),
    concepts: z.any().describe('Extracted concepts'),
    questions: z.any().describe('Generated questions'),
    qualityReport: z.any().describe('Quality evaluation results'),
    conceptMap: z.any().describe('Concept relationships'),
    studyPlan: z.any().describe('KoLearning study plan'),
  }).describe('Complete pipeline results'),
  atoms: z.array(z.object({
    question: z.string().describe('The question generated from the study material.'),
    answer: z.string().describe('The answer to the question.'),
    incorrectAnswers: z.array(z.string()).optional().describe('An array of plausible incorrect answers (distractors).')
  })).describe('Questions converted to legacy atom format for compatibility.'),
});
export type GenerateAtomsOutput = z.infer<typeof GenerateAtomsOutputSchema>;

export const generateAtomsFlow = ai.defineFlow(
  {
    name: 'generateAtomsFromLargeContentWithProgress',
    inputSchema: GenerateAtomsInputSchema,
    outputSchema: GenerateAtomsOutputSchema,
    streamSchema: z.object({
      stage: z.string(),
      message: z.string(),
      details: z.string().optional(),
      progress: z.number()
    }).optional()
  },
  async (input: GenerateAtomsInput) => {
    return generateAtomsFromLargeContentWithProgress(input, () => { });
  }
);

export async function generateAtoms(input: GenerateAtomsInput): Promise<GenerateAtomsOutput> {
  return generateAtomsFromLargeContentWithProgress(input, () => { });
}

export async function generateAtomsFromLargeContent(input: GenerateAtomsInput): Promise<GenerateAtomsOutput> {
  return generateAtomsFromLargeContentWithProgress(input, () => { });
}

export async function generateAtomsFromLargeContentWithProgress(
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

    // Etapa 5: Generate distractors for atoms that are missing them
    const atomsMissingDistractors = atomsResult.atoms.filter(
      a => !a.incorrectAnswers || a.incorrectAnswers.length === 0
    );

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
        const batchDistractors = await generateDistractorsBatch(
          atomsMissingDistractors.map(a => ({ question: a.question, answer: a.answer })),
          documentContext.subject
        );

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
      } catch (error) {
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
async function generateDistractorsBatch(
  atoms: { question: string; answer: string }[],
  subject: string
): Promise<string[][]> {
  console.log(`=== BATCH DISTRACTOR GENERATION: ${atoms.length} atoms ===`);

  // Process in chunks of 15 to avoid token limits
  const chunkSize = 15;
  const allDistractors: string[][] = [];

  for (let i = 0; i < atoms.length; i += chunkSize) {
    const chunk = atoms.slice(i, i + chunkSize);
    const atomsList = chunk.map((a, idx) =>
      `${idx + 1}. Pregunta: "${a.question}"\n   Respuesta correcta: "${a.answer}"`
    ).join('\n\n');

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

      if (response?.output?.distractors) {
        // Ensure each entry has exactly 3 distractors
        for (const d of response.output.distractors) {
          while (d.length < 3) d.push('Opción incorrecta');
          allDistractors.push(d.slice(0, 3));
        }
        // Fill in any missing entries
        while (allDistractors.length < i + chunk.length) {
          allDistractors.push(['Opción A incorrecta', 'Opción B incorrecta', 'Opción C incorrecta']);
        }
      } else {
        // Fill with defaults for this chunk
        for (let j = 0; j < chunk.length; j++) {
          allDistractors.push(['Opción A incorrecta', 'Opción B incorrecta', 'Opción C incorrecta']);
        }
      }
    } catch (error) {
      console.warn(`Batch distractor generation failed for chunk ${i / chunkSize + 1}:`, error);
      for (let j = 0; j < chunk.length; j++) {
        allDistractors.push(['Opción A incorrecta', 'Opción B incorrecta', 'Opción C incorrecta']);
      }
    }
  }

  console.log(`=== BATCH DISTRACTORS COMPLETE: ${allDistractors.length} sets ===`);
  return allDistractors;
}

// Análisis de contexto unificado que incluye título, descripción y metadatos
async function analyzeDocumentContextUnified(content: string, isPDF: boolean, onProgress: (progress: any) => void) {
  console.log('=== ANALYZING UNIFIED DOCUMENT CONTEXT ===');
  console.log('isPDF:', isPDF);
  console.log('content length:', content.length);

  onProgress({
    stage: 'context_analysis',
    message: '🔍 Analizando tema y estructura...',
    details: 'Identificando contexto educativo del documento',
    progress: 20
  });

  try {
    const contentPreview = content.length > 20000 ? content.substring(0, 20000) + '...' : content;
    const prompt = `Analiza este ${isPDF ? 'documento PDF' : 'contenido'} educativo y extrae:

1. Título principal del documento
2. Descripción breve del contenido (1-2 oraciones)
3. Campo de estudio o materia principal
4. Nivel académico apropiado
5. Categorías relevantes (máximo 3)
6. Tipo de documento

CONTENIDO (VISTA PREVIA Y FINAL):
${content.length > 30000 ? content.substring(0, 15000) + '\n\n...[CONTENIDO OMITIDO]...\n\n' + content.substring(content.length - 15000) : content}

FORMATO DE RESPUESTA (JSON):
{
  "inferredTitle": "Título del documento",
  "inferredDescription": "Descripción breve",
  "subject": "Campo de estudio",
  "academicLevel": "undergraduate",
  "categories": ["categoría1", "categoría2"],
  "documentType": "other"
}

Usa únicamente estos valores para academicLevel: elementary, high_school, undergraduate, graduate, professional
Usa únicamente estos valores para documentType: academic_paper, textbook, manual, lecture_notes, article, other`;

    console.log('=== SENDING CONTEXT ANALYSIS REQUEST ===');
    const response = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
      output: {
        schema: z.object({
          inferredTitle: z.string().min(1),
          inferredDescription: z.string().min(1),
          subject: z.string().min(1),
          academicLevel: z.enum(['elementary', 'high_school', 'undergraduate', 'graduate', 'professional']),
          categories: z.array(z.string()).min(1).max(3),
          documentType: z.enum(['academic_paper', 'textbook', 'manual', 'lecture_notes', 'article', 'other'])
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
    console.log('Output exists?', !!response?.output);

    if (!response?.output) {
      throw new Error('El modelo no retornó un análisis válido');
    }

    // Validar que todos los campos requeridos están presentes
    const result = response.output;
    if (!result.inferredTitle || !result.inferredDescription || !result.subject) {
      throw new Error('Análisis incompleto: faltan campos requeridos');
    }

    console.log('Document context analyzed successfully:', result);
    return result;

  } catch (error) {
    console.error('Error in analyzeDocumentContextUnified:', error);
    throw error; // Re-throw para que se maneje en el nivel superior
  }
}

// Generación de átomos con contexto previo
async function generateAtomsWithContext(content: string, isPDF: boolean, documentContext: any, onProgress: (progress: any) => void) {
  console.log('=== GENERATE ATOMS WITH CONTEXT START ===');
  console.log('isPDF:', isPDF);
  console.log('documentContext:', documentContext);
  console.log('content length:', content.length);

  onProgress({
    stage: 'extracting_with_context',
    message: '🧠 Extrayendo conceptos específicos...',
    details: `Generando preguntas sobre ${documentContext.subject}`,
    progress: 60
  });

  const contentSlice = content.length > 50000 ? content.substring(0, 50000) + '...' : content;
  const atomsPrompt = `Eres un experto en ${documentContext.subject} que extrae preguntas educativas específicas del contenido proporcionado. Debes crear preguntas ÚNICAMENTE basadas en el contenido real del documento.

CONTEXTO CONOCIDO:
- Tema: ${documentContext.subject}
- Nivel: ${documentContext.academicLevel}
- Tipo: ${documentContext.documentType}

CONTENIDO:
${contentSlice}

INSTRUCCIONES ESPECÍFICAS:
1. Genera preguntas ÚNICAMENTE sobre ${documentContext.subject}
2. Nivel de dificultad apropiado para ${documentContext.academicLevel}
3. Enfócate en conceptos, definiciones, procesos educativos del texto
4. Genera TODOS los átomos necesarios para cubrir el contenido del documento de manera completa y exhaustiva
5. Prioriza la cobertura completa del material sobre un número fijo de preguntas
6. Asegúrate de que cada concepto, definición, proceso y detalle importante tenga su correspondiente átomo de conocimiento

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
  console.log('Output exists?', !!response?.output);
  console.log('Atoms count:', response?.output?.atoms?.length || 0);

  // Robust validation of the AI model's response
  if (!response?.output || !Array.isArray(response.output.atoms)) {
    console.error('CRITICAL: AI response is missing or `atoms` is not an array.', response);
    throw new Error('El modelo no devolvió una estructura de átomos válida.');
  }

  // Filter for valid and non-empty atoms
  const validAtoms = (response.output.atoms as { question: string; answer: string; incorrectAnswers?: string[] }[]).filter((atom, index) => {
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
        reason: `Question length: ${atom.question?.trim().length}, Answer length: ${atom.answer?.trim().length}`
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
async function generateAtomsInChunks(content: string, documentContext: any, onProgress: (progress: any) => void) {
  const CHUNK_SIZE = 35000;
  const OVERLAP = 3000;
  const totalLength = content.length;

  if (totalLength <= CHUNK_SIZE + OVERLAP) {
    return generateAtomsWithContext(content, false, documentContext, onProgress);
  }

  console.log(`=== PROCESSING CONTENT IN CHUNKS: ${totalLength} characters ===`);
  const chunks: string[] = [];
  for (let i = 0; i < totalLength; i += (CHUNK_SIZE - OVERLAP)) {
    chunks.push(content.substring(i, i + CHUNK_SIZE));
    if (i + CHUNK_SIZE >= totalLength) break;
  }

  console.log(`Split into ${chunks.length} chunks`);
  let allAtoms: any[] = [];

  for (let i = 0; i < chunks.length; i++) {
    onProgress({
      stage: 'extracting_chunks',
      message: `🧠 Procesando parte ${i + 1} de ${chunks.length}...`,
      details: `Extrayendo contenido de ${documentContext.subject}`,
      progress: 40 + Math.round((i / chunks.length) * 30)
    });

    try {
      const result = await generateAtomsWithContext(chunks[i], false, documentContext, () => { });
      allAtoms = [...allAtoms, ...result.atoms];
      console.log(`Chunk ${i + 1} produced ${result.atoms.length} atoms. Total so far: ${allAtoms.length}`);
    } catch (error) {
      console.warn(`Error in chunk ${i + 1}, skipping:`, error);
    }
  }

  // Basic deduplication based on normalized question text
  const seenQuestions = new Set();
  const uniqueAtoms = allAtoms.filter(atom => {
    const normalized = atom.question.toLowerCase().trim().replace(/[?¿!¡]/g, '');
    if (seenQuestions.has(normalized)) return false;
    seenQuestions.add(normalized);
    return true;
  });

  console.log(`=== CHUNK PROCESSING COMPLETE ===`);
  console.log(`Original total: ${allAtoms.length}, Unique after deduplication: ${uniqueAtoms.length}`);

  return { atoms: uniqueAtoms };
}

// Function to decode data URI for text files only
function decodeDataURI(dataURI: string): string {
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
  } catch (error) {
    console.error('Error decoding data URI:', error);
    throw new Error('Failed to decode study material');
  }
}