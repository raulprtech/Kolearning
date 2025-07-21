
'use server';

import { generateDeckFromText } from '@/ai/flows/generate-deck-from-text';
import { evaluateOpenAnswer } from '@/ai/flows/evaluate-open-answer';
import type { EvaluateOpenAnswerInput } from '@/ai/flows/evaluate-open-answer';
import { generateOptionsForQuestion } from '@/ai/flows/generate-options-for-question';
import type { GenerateOptionsForQuestionInput } from '@/ai/flows/generate-options-for-question';
import { z } from 'zod';
import type { Project, Flashcard as FlashcardType } from '@/types';

// In-memory store for created projects
let createdProjects: Project[] = [];

const FlashcardSchema = z.object({
  id: z.number(),
  question: z.string().min(1),
  answer: z.string().min(1),
  image: z.string().optional(),
});

const CreateProjectInputSchema = z.array(FlashcardSchema);

function createSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric characters
      .trim()
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // remove consecutive hyphens
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

export async function handleCreateProject(
    title: string, 
    description: string, 
    category: string,
    flashcards: z.infer<typeof CreateProjectInputSchema>
) {
    const validation = CreateProjectInputSchema.safeParse(flashcards);
    if (!validation.success) {
        console.error("Invalid flashcard data:", validation.error.flatten());
        return { error: 'Invalid flashcard data provided.' };
    }

    if (!title || flashcards.length === 0) {
        return { error: 'Project must have a title and at least one flashcard.' };
    }
    
    const slug = createSlug(title);

    const newProject: Project & { flashcards: FlashcardType[] } = {
        id: `gen-${Date.now()}`,
        slug: slug,
        title: title,
        description: description,
        category: category || 'General',
        author: 'User',
        size: flashcards.length,
        bibliography: [],
        flashcards: flashcards.map(fc => ({...fc, id: fc.id.toString(), deckId: `gen-${Date.now()}`}))
    };

    try {
        createdProjects.push(newProject);
        return { project: newProject };
    } catch (error) {
        console.error('Error creating project:', error);
        return { error: 'Sorry, I was unable to save the project.' };
    }
}


export async function getGeneratedProject(projectSlug: string) {
    const project = createdProjects.find(d => d.slug === projectSlug);
    if (project) {
        return project;
    }
    return null;
}

export async function handleQuizletUrlImport(quizletUrl: string) {
    if (!quizletUrl || !quizletUrl.startsWith('https://quizlet.com/')) {
        return { error: 'Please provide a valid Quizlet URL.' };
    }

    try {
        const response = await fetch(quizletUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch Quizlet page. Status: ${response.status}`);
        }
        const html = await response.text();

        // Find the script tag containing the set data. This is brittle and might break if Quizlet changes their site.
        const scriptContentRegex = /<script id="__NEXT_DATA__" type="application\/json">({.*})<\/script>/;
        const match = html.match(scriptContentRegex);

        if (!match || !match[1]) {
            throw new Error('Could not find Quizlet data on the page. The set might be private or the import method needs an update.');
        }

        const data = JSON.parse(match[1]);
        const setDetails = data.props?.pageProps?.pageData?.set;

        if (!setDetails) {
             throw new Error('Could not parse set details from Quizlet data.');
        }
        
        const title = setDetails.title;
        const description = setDetails.description;
        const category = 'Quizlet Import';

        // Find flashcard terms
        const terms = setDetails.terms;
        if (!terms || terms.length === 0) {
             throw new Error('No flashcard terms found in the Quizlet data.');
        }

        const flashcards = terms.map((term: any, index: number) => ({
            id: term.id || Date.now() + index,
            question: term.word,
            answer: term.definition,
        }));

        // We have the data, now create a project
        const projectData = {
            title,
            description,
            category,
            flashcards
        };
        
        return await handleCreateProject(projectData.title, projectData.description, projectData.category, projectData.flashcards);

    } catch (error: any) {
        console.error('Error importing from Quizlet URL:', error);
        return { error: error.message || 'An unknown error occurred during import.' };
    }
}


export async function handleEvaluateOpenAnswer(input: EvaluateOpenAnswerInput) {
  try {
    const evaluation = await evaluateOpenAnswer(input);
    return { evaluation };
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return { error: 'Sorry, I was unable to evaluate your answer.' };
  }
}

export async function handleGenerateOptionsForQuestion(input: GenerateOptionsForQuestionInput) {
    try {
        const result = await generateOptionsForQuestion(input);
        return { options: result.options };
    } catch (error) {
        console.error('Error generating options:', error);
        return { error: 'Sorry, I was unable to generate options for this question.' };
    }
}
