
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
// Flujos de IA (sin cambios)
import { generateDeckFromText } from '@/ai/flows/generate-deck-from-text';
import { refineProjectDetails } from '@/ai/flows/refine-project-details';
import { generateStudyPlan } from '@/ai/flows/generate-study-plan';
import { refineStudyPlan } from '@/ai/flows/refine-study-plan';

// Tipos (sin cambios, asumiendo que existen en @/types)
import type {
  Project,
  Flashcard as FlashcardType,
  StudyPlan,
  ProjectDetails,
  RefineProjectDetailsInput,
  GenerateStudyPlanInput,
  SessionPerformanceSummary,
} from '@/types';

// --- Helper para obtener la sesión del usuario de Supabase ---
async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }
  return user;
}

// --- Lógica de Creación de Slug (sin cambios) ---
function createSlug(title: string) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
    const p = new RegExp(a.split('').join('|'), 'g');
    return title.toString().toLowerCase().replace(/\s+/g, '-').replace(p, c => b.charAt(a.indexOf(c))).replace(/&/g, '-and-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
}

export async function handleGenerateProjectFromPdf(
  pdfDataUri: string,
  fileName: string,
) {
  if (!pdfDataUri) {
    return { error: 'PDF data cannot be empty.' };
  }
  try {
    const result = await generateDeckFromText({ studyNotes: pdfDataUri });
    return { project: result };
  } catch (error) {
    console.error('Error with PDF project generation:', error);
    return { error: 'Sorry, I was unable to generate a project from your PDF.' };
  }
}

export async function handleGenerateProjectFromImages(imageDataUris: string[]) {
  if (!imageDataUris || imageDataUris.length === 0) {
    return { error: 'No images provided.' };
  }
  try {
    const result = await generateDeckFromText({ studyNotes: imageDataUris });
    return { project: result };
  } catch (error) {
    console.error('Error with multi-image project generation:', error);
    return { error: 'Sorry, I was unable to generate a project from your images.' };
  }
}

export async function handleGenerateProjectFromText(studyNotes: string) {
  if (!studyNotes) {
    return { error: 'Study notes cannot be empty.' };
  }
  try {
    const result = await generateDeckFromText({ studyNotes });
    return { project: result };
  } catch (error) {
    console.error('Error with project generation AI:', error);
    return { error: 'Sorry, I was unable to generate a project from your notes.' };
  }
}

export async function handlePastedTextImport(
  pastedText: string,
  termSeparator: string,
  rowSeparator: string,
  customTermSeparator?: string,
  customRowSeparator?: string,
) {
  const getSeparator = (type: 'term' | 'row') => {
    if (type === 'term') {
      if (termSeparator === 'tab') return '\t';
      if (termSeparator === 'comma') return ',';
      return customTermSeparator || '\t';
    }
    if (rowSeparator === 'newline') return '\n';
    if (rowSeparator === 'semicolon') return ';';
    return (customRowSeparator || '\n').replace(/\\n/g, '\n');
  };
  const rowSep = getSeparator('row');
  const termSep = getSeparator('term');
  const rows = pastedText.split(rowSep).filter(row => row.trim() !== '');
  const parsedCards = rows
    .map(row => {
      const parts = row.split(termSep);
      return {
        question: parts[0] || '',
        answer: parts.slice(1).join(termSep) || '',
      };
    })
    .filter(card => card.question);
  return parsedCards;
}

export async function handleGenerateProjectFromWebUrl(webUrl: string) {
  if (!webUrl) {
    return { error: 'Web page URL cannot be empty.' };
  }
  try {
    const response = await fetch(webUrl);
    if (!response.ok) {
      return { error: `Could not fetch content from the URL. Status: ${response.status}` };
    }
    const htmlContent = await response.text();
    const result = await generateDeckFromText({ studyNotes: htmlContent });
    return { project: result };
  } catch (error) {
    console.error('Error with web page project generation:', error);
    return { error: 'Could not process the web page. Please check the URL and try again.' };
  }
}

export async function handleRefineProjectDetails(input: RefineProjectDetailsInput) {
  try {
    const result = await refineProjectDetails(input);
    return { details: result };
  } catch (error) {
    console.error('Error refining project details:', error);
    return { error: 'Sorry, I was unable to refine the project details.' };
  }
}

export async function handleGenerateStudyPlan(input: GenerateStudyPlanInput) {
  try {
    const result = await generateStudyPlan(input);
    return { plan: result };
  } catch (error) {
    console.error('Error generating study plan:', error);
    return { error: 'Sorry, I was unable to generate a study plan.' };
  }
}

export async function handleCreateProject(
  projectDetails: ProjectDetails,
  flashcards: Omit<FlashcardType, 'id' | 'projectId'>[],
  studyPlan: StudyPlan,
) {
  const user = await getAuthenticatedUser();
  const supabase = await createSupabaseServerClient();

  if (!projectDetails.title || flashcards.length === 0) {
    throw new Error('El proyecto debe tener un título y al menos una flashcard.');
  }

  const titleSlug = createSlug(projectDetails.title);
  const uniqueSuffix = Math.random().toString(36).substring(2, 10);
  const slug = `${titleSlug}-${uniqueSuffix}`;

  // 1. Insertar el proyecto principal
  const { data: newProject, error: projectError } = await supabase
    .from('Project') // Asegúrate que el nombre de la tabla sea correcto ('Project' o 'projects')
    .insert({
      title: projectDetails.title,
      description: projectDetails.description,
      slug: slug,
      userId: user.id,
      // ... otros campos del proyecto
    })
    .select()
    .single(); // .single() devuelve un solo objeto en lugar de un array

  if (projectError || !newProject) {
    console.error('Error creating project in Supabase:', projectError);
    throw new Error('No se pudo guardar el proyecto en la base de datos.');
  }

  // 2. Preparar y insertar las flashcards asociadas
  const flashcardsToInsert = flashcards.map(fc => ({
    question: fc.question,
    answer: fc.answer,
    projectId: newProject.id, // Asociar con el ID del proyecto recién creado
  }));

  const { error: flashcardsError } = await supabase
    .from('Flashcard') // Asegúrate que el nombre de la tabla sea correcto
    .insert(flashcardsToInsert);

  if (flashcardsError) {
    console.error('Error creating flashcards in Supabase:', flashcardsError);
    // Opcional: podrías eliminar el proyecto si las flashcards fallan para mantener la consistencia
    await supabase.from('Project').delete().match({ id: newProject.id });
    throw new Error('No se pudieron guardar las flashcards.');
  }
  
  revalidatePath('/dashboard');
  redirect(`/mis-proyectos/${slug}`);
}


export async function handleEndSessionAndRefinePlan(
  projectId: string,
  completedSessionIndex: number,
  performanceSummary: SessionPerformanceSummary
) {
  const user = await getAuthenticatedUser();
  const supabase = await createSupabaseServerClient();

  // 1. Obtener el proyecto actual
  const { data: project, error: projectError } = await supabase
    .from('Project')
    .select('studyPlan')
    .eq('id', projectId)
    .eq('userId', user.id)
    .single();

  if (projectError || !project) {
    console.error('Error fetching project or project not found:', projectError);
    return { planUpdated: false, reasoning: 'Project not found.' };
  }

  // 2. Actualizar el contador de sesiones completadas
  const { error: updateError } = await supabase
    .from('Project')
    .update({ completedSessions: completedSessionIndex + 1 })
    .eq('id', projectId);

  if (updateError) {
    console.error('Error updating completed sessions:', updateError);
    // No detenemos el flujo, la refinación del plan puede continuar
  }

  // 3. Llamar a la IA para refinar el plan
  try {
    const currentPlan = project.studyPlan?.plan || [];
    const refinementResult = await refineStudyPlan({
      currentPlan,
      completedSessionIndex,
      performanceSummary,
    });

    // 4. Si la IA sugiere cambios, actualizar el plan en la base de datos
    if (refinementResult.needsChange) {
      const newStudyPlan = { ...project.studyPlan, plan: refinementResult.updatedPlan };
      const { error: planUpdateError } = await supabase
        .from('Project')
        .update({ studyPlan: newStudyPlan })
        .eq('id', projectId);

      if (planUpdateError) {
        console.error('Error updating study plan:', planUpdateError);
        return { planUpdated: false, reasoning: 'Failed to save updated plan.' };
      }
      
      revalidatePath(`/mis-proyectos/${projectId}`);
      return { planUpdated: true, reasoning: refinementResult.reasoning };
    }

    return { planUpdated: false };
  } catch (aiError) {
    console.error('Error refining study plan with AI:', aiError);
    return { planUpdated: false, reasoning: 'AI refinement failed.' };
  }
}

/**
 * Obtiene todos los proyectos (públicos, por ejemplo).
 */
export async function getAllProjects(): Promise<Project[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Project')
    .select('*');
    // .eq('isPublic', true); // Ejemplo de filtro para proyectos públicos

  if (error) {
    console.error('Error fetching all projects:', error);
    return [];
  }

  return data as unknown as Project[];
}

/**
 * Obtiene los proyectos del usuario autenticado.
 */
export async function getUserProjects() {
    const user = await getAuthenticatedUser();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('Project')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

    if (error) {
        console.error('Error fetching user projects:', error);
        return [];
    }

    return data;
}

    