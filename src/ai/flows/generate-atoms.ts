'use server';

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
    content = filterSensitiveInfo(parsed.text || '');
    isPDF = true;
  } else {
    console.log('Text file detected - decoding content');
    content = filterSensitiveInfo(decodeDataURI(input.studyMaterial));

    console.log('=== DEBUGGING CONTENT DECODING ===');
    console.log('Decoded content length:', content.length);
    console.log('Content preview (first 500 chars):', content.substring(0, 500));
    console.log('Content preview (last 200 chars):', content.substring(Math.max(0, content.length - 200)));

    if (!content || content.length < 10) {
      throw new Error('Contenido del documento vacío o demasiado corto');
    }
  }

  // Stage 3: Atoms Generation
  onProgress({
    stage: 'generating_atoms',
    message: '🧠 Generating knowledge atoms...',
    details: `Initiating semantic analysis of the document`,
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
    const atomsMissingDistractors = atomsResult.atoms.filter(
      a => !a.incorrectAnswers || a.incorrectAnswers.length === 0
    );

    if (atomsMissingDistractors.length > 0) {
      onProgress({
        stage: 'generating_distractors',
        message: '🎯 Generating answer options...',
        details: `Creating distractors for ${atomsMissingDistractors.length} atoms`,
        progress: 75
      });

      console.log(`=== GENERATING DISTRACTORS FOR ${atomsMissingDistractors.length} ATOMS ===`);

      // Generate distractors in batch via a single AI call for efficiency
      try {
        const batchDistractors = await generateDistractorsBatch(
          atomsMissingDistractors.map(a => ({ question: a.question, answer: a.answer })),
          fallbackContext.subject
        );

        // Merge distractors back into atoms
        let distractorIndex = 0;
        for (const atom of atomsResult.atoms) {
          if (!atom.incorrectAnswers || atom.incorrectAnswers.length === 0) {
            atom.incorrectAnswers = batchDistractors[distractorIndex] || [
              'Incorrect option A',
              'Incorrect option B',
              'Incorrect option C'
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
              `Not correct: variation of "${atom.answer.substring(0, 30)}..."`,
              'This option is incorrect',
              'None of the above apply'
            ];
          }
        }
      }
    }

    // Stage 6: Metadata and Title Inference from Generated Atoms
    onProgress({
      stage: 'analyzing_context',
      message: '📄 Inferring project metadata...',
      details: `> Summarizing general theme from ${atomsResult.atoms.length} extracted concepts`,
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
    } catch (error) {
      console.error('Error analyzing deferred document context:', error);
      documentContext = {
        inferredTitle: "Study Project",
        inferredDescription: `Project generated from ${atomsResult.atoms.length} atoms.`,
        subject: "General",
        academicLevel: "undergraduate",
        categories: ["General"],
        documentType: "other"
      };
    }

    onProgress({
      stage: 'finalizing',
      message: '✅ Finalizing knowledge atoms...',
      details: `${atomsResult.atoms.length} atoms with answer options`,
      progress: 90
    });

    const result = {
      initialResponse: `Hello! I've processed your ${documentContext.subject} document and extracted ${atomsResult.atoms.length} relevant knowledge atoms from the specific content you uploaded.`,
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
    console.log('Has documentContext?', !!result.pipeline?.documentContext);
    console.log('Document context keys:', Object.keys(result.pipeline?.documentContext || {}));

    return result;

  } catch (error) {
    console.error('Error generating atoms:', error);
    throw new Error(`Error generating atoms from document: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    throw new Error('Invalid data URI format');
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
      throw new Error('Document content is empty or too short');
    }
  }

  // Stage 3: Unified Context Analysis (title, subject, level, structure)
  onProgress({
    stage: 'analyzing_context',
    message: '📄 Analyzing document context...',
    details: `Identifying document subject, title, and structure`,
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
    throw new Error(`Critical error in context analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Stage 4: Atom Generation with Context
  onProgress({
    stage: 'generating_atoms',
    message: '🧠 Generating atoms based on context...',
    details: `Extracting educational content from ${documentContext.subject}`,
    progress: 40
  });

  try {
    console.log('=== STARTING ATOMS GENERATION ===');
    const atomsResult = await generateAtomsInChunks(content, documentContext, onProgress);
    console.log('=== ATOMS GENERATION COMPLETE ===');
    console.log('Atoms result:', atomsResult.atoms.length, 'atoms');

    const result = {
      initialResponse: `Hello! I've processed your ${documentContext.subject} document and extracted ${atomsResult.atoms.length} relevant knowledge atoms from the specific content you uploaded.`,
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
    throw new Error(`Error generating atoms from document: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    throw new Error('Invalid data URI format');
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
      throw new Error('Document content is empty or too short');
    }
  }

  // Stage 3: Unified Context Analysis (title, subject, level, structure)
  onProgress({
    stage: 'analyzing_context',
    message: '📄 Analyzing document context...',
    details: `Identifying document subject, title, and structure`,
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
    throw new Error(`Critical error in context analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Stage 4: Atom Generation with Context
  onProgress({
    stage: 'generating_atoms',
    message: '🧠 Generating atoms based on context...',
    details: `Extracting educational content from ${documentContext.subject}`,
    progress: 40
  });

  try {
    console.log('=== STARTING ATOMS GENERATION ===');
    const atomsResult = await generateAtomsInChunks(content, documentContext, onProgress);
    console.log('=== ATOMS GENERATION COMPLETE ===');
    console.log('Atoms result:', atomsResult.atoms.length, 'atoms');

    const result = {
      initialResponse: `Hello! I've processed your ${documentContext.subject} document and extracted ${atomsResult.atoms.length} relevant knowledge atoms from the specific content you uploaded.`,
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
    throw new Error(`Error generating atoms from document: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      `${idx + 1}. Question: "${a.question}"\n   Correct Answer: "${a.answer}"`
    ).join('\n\n');

    const batchPrompt = `You are an expert in ${subject} creating educational content.
For each question and correct answer below, generate EXACTLY 3 incorrect but plausible answer options (distractors).
Distractors should be related concepts that a student might confuse with the correct answer.

${atomsList}

RESPONSE FORMAT (JSON):
{
  "distractors": [
    ["distractor1_for_question1", "distractor2_for_question1", "distractor3_for_question1"],
    ["distractor1_for_question2", "distractor2_for_question2", "distractor3_for_question2"]
  ]
}

IMPORTANT: The "distractors" array must have EXACTLY ${chunk.length} sub-arrays, one for each question, in the SAME order.`;

    try {
      const response = await ai.generate({
        prompt: batchPrompt,
        model: 'googleai/gemini-2.5-flash-lite',
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
          while (d.length < 3) d.push('Incorrect option');
          allDistractors.push(d.slice(0, 3));
        }
        // Fill in any missing entries
        while (allDistractors.length < i + chunk.length) {
          allDistractors.push(['Incorrect option A', 'Incorrect option B', 'Incorrect option C']);
        }
      } else {
        // Fill with defaults for this chunk
        for (let j = 0; j < chunk.length; j++) {
          allDistractors.push(['Incorrect option A', 'Incorrect option B', 'Incorrect option C']);
        }
      }
    } catch (error) {
      console.warn(`Batch distractor generation failed for chunk ${i / chunkSize + 1}:`, error);
      for (let j = 0; j < chunk.length; j++) {
        allDistractors.push(['Incorrect option A', 'Incorrect option B', 'Incorrect option C']);
      }
    }
  }

  console.log(`=== BATCH DISTRACTORS COMPLETE: ${allDistractors.length} sets ===`);
  return allDistractors;
}

// Unified context analysis based on generated knowledge atoms
export async function analyzeDocumentContextUnified(atoms: Array<{ question: string; answer: string }>, onProgress: (progress: any) => void) {
  console.log('=== ANALYZING UNIFIED DOCUMENT CONTEXT FROM ATOMS ===');
  console.log('Atoms sampled for context:', atoms.length);

  onProgress({
    stage: 'context_analysis',
    message: '🔍 Inferring title and subject...',
    details: 'Generating structured metadata from atoms',
    progress: 90
  });

  try {
    const atomsPreview = atoms.map((a, i) => `[${i}] Q: ${a.question}\nA: ${a.answer}`).join('\n\n');
    const prompt = `Analyze the following sample of knowledge (Question and Answer) extracted from a study document, and based ONLY on them, infer:

1. Representative main title of the general theme (Maximum 7 words, direct and clear)
2. Brief description of what the knowledge covers (1-2 sentences)
3. Main field of study or subject
4. Appropriate academic level
5. Relevant categories (maximum 3)
6. Probable original document type

CRITICAL RULE FOR THE TITLE:
It is STRICTLY FORBIDDEN to use generic or placeholder titles like "Analyzed Document", "Study Project", "Document", "Notes", etc. You MUST obligatorily infer the theme or central concept based on the actual content of the atoms. For example, if the atoms talk about the French Revolution, the title MUST be "French Revolution", NOT "History Document".

KNOWLEDGE SAMPLE (ATOMS):
${atomsPreview}

RESPONSE FORMAT (JSON):
{
  "inferredTitle": "Inferred title of the specific theme",
  "inferredDescription": "Brief description",
  "subject": "Field of study",
  "academicLevel": "undergraduate",
  "categories": ["category1", "category2"],
  "documentType": "other"
}

Use only these values for academicLevel: elementary, high_school, undergraduate, graduate, professional
Use only these values for documentType: academic_paper, textbook, manual, lecture_notes, article, other`;

    const response = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash-lite',
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
    console.log('Output exists?', !!response?.output);

    const result = response?.output;

    const fallbackTitleFromAtoms = atoms && atoms.length > 0
      ? atoms[0].question.substring(0, 40) + '...'
      : "Study Project";

    // Provide sensible defaults if fields are missing or if generation was cut off
    // We intentionally make the fallback title more generic if the AI completely failed
    const finalResult = {
      inferredTitle: result?.inferredTitle || fallbackTitleFromAtoms,
      inferredDescription: result?.inferredDescription || "Automatically processed study document.",
      subject: result?.subject || "Study",
      academicLevel: result?.academicLevel || "undergraduate",
      categories: result?.categories && result.categories.length > 0 ? result.categories : ["General"],
      documentType: result?.documentType || "other"
    };

    console.log('Document context verified successfully with possible fallbacks:', finalResult);
    return finalResult;

  } catch (error) {
    console.error('Error in analyzeDocumentContextUnified, returning safe fallback context to prevent process failure:', error);

    // Graceful fallback to avoid breaking the entire project creation process
    // if AI safety filters or context length issues occur.
    const fallbackTitleFromAtomsError = atoms && atoms.length > 0
      ? atoms[0].question.substring(0, 40) + '...'
      : "Analyzed Document";

    return {
      inferredTitle: fallbackTitleFromAtomsError,
      inferredDescription: "Study document reviewed with limited options due to content filters.",
      subject: "Study",
      academicLevel: "undergraduate",
      categories: ["General"],
      documentType: "other"
    };
  }
}

// Atom generation with prior context (or without it)
async function generateAtomsWithContext(content: string, isPDF: boolean, documentContext: any, onProgress: (progress: any) => void) {
  console.log('=== GENERATE ATOMS START ===');
  console.log('isPDF:', isPDF);
  console.log('documentContext:', documentContext);
  console.log('content length:', content.length);

  const contentSlice = content.length > 50000 ? content.substring(0, 50000) + '...' : content;

  const ctxSubject = documentContext?.subject || "General Document";
  const ctxLevel = documentContext?.academicLevel || "General";

  onProgress({
    stage: 'extracting_with_context',
    message: '🧠 Extracting main concepts...',
    details: `> Initializing semantic extraction module...\n> Configuring discard filters...\n> Reading fragment of ${contentSlice.length} characters...\n> Looking for key concepts and structural relationships...`,
    progress: 40
  });

  const atomsPrompt = `You are an educational expert extracting specific questions from the provided content. You must create questions ONLY about the informative and conceptual core of the text.

KNOWN CONTEXT:
- Subject: ${ctxSubject}
- Level: ${ctxLevel}

CONTENT:
${contentSlice}

SPECIFIC EXTRACTION AND QUALITY INSTRUCTIONS:
1. ABSOLUTELY IGNORE the following sections (do not generate questions about them):
   - Indexes, tables of contents, and structured glossaries.
   - Bibliographies, author references, academic citations, and reference lists.
   - Acknowledgments, dedications, generic introductions, and filler or administrative text.
   - File metadata, page numbers, repetitive headers, or irrelevant footnotes.
2. FOCUS EXCLUSIVELY on the central educational content:
   - Key concepts, fundamental definitions, processes, formulas, critical historical dates, and important conceptual relationships of ${documentContext.subject}.
3. QUALITY OVER QUANTITY, BUT BEING EXHAUSTIVE:
   - Extract all important concepts present in the text, regardless of whether they result in a high number of questions.
   - However, DO NOT sacrifice quality. Each atom (question/answer) must condense a main topic effectively, directly, and without ambiguities.
   - If a paragraph or section does not contain valuable or main educational information, ignore it completely.
4. Appropriate difficulty level for: ${documentContext.academicLevel}. Ensure explanations are clear and concise.

RESPONSE FORMAT (JSON):
{
  "atoms": [
    { "question": "string", "answer": "string" }
  ]
}`;

  console.log('=== SENDING AI REQUEST ===');
  const response = await ai.generate({
    prompt: atomsPrompt,
    model: 'googleai/gemini-2.5-flash-lite',
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
    throw new Error('The model did not return a valid atom structure.');
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
      message: `🧠 Processing chunk ${i + 1} of ${chunks.length}...`,
      details: `> Loading chunk into context memory (size: ${chunks[i].length} tokens)...\n> Main context integrity: Active.\n> Scanning technical concepts and semantic relationships...\n> Generating sub-atoms...`,
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
    const base64 = dataURI.split(',')[1];
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Error decoding data URI:', error);
    return '';
  }
}

/**
 * Filter sensitive information (PII) from text before processing or storage.
 * Redacts emails, phone numbers, credit cards, and IP addresses.
 */
function filterSensitiveInfo(text: string): string {
  if (!text) return '';

  // 1. Emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // 2. Phone numbers (various formats)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

  // 3. Credit Cards (simple pattern, not exhaustive but covers most)
  const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

  // 4. IPv4 Addresses
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

  return text
    .replace(emailRegex, '[EMAIL_REDACTED]')
    .replace(phoneRegex, '[PHONE_REDACTED]')
    .replace(ccRegex, '[CREDIT_CARD_REDACTED]')
    .replace(ipRegex, '[IP_REDACTED]');
}