import { createClient } from './client'
import { Database } from '@/lib/database.types'
import { Atom, Project, Source, Session, LearningPathItem, Paper } from '@/contexts/ProjectContext'

type Tables = Database['public']['Tables']
type ProjectRow = Tables['projects']['Row']
type AtomRow = Tables['atoms']['Row']
type SourceRow = Tables['sources']['Row']
type SessionRow = Tables['sessions']['Row']
type LearningPathRow = Tables['learning_path_items']['Row']
type PaperRow = any // Use any for now as database.types.ts might not be updated yet

// Convert database types to frontend types
export const convertPaperFromDB = (paperRow: any): Paper => ({
  id: paperRow.id,
  title: paperRow.title,
  authors: paperRow.authors || [],
  year: paperRow.year,
  doi: paperRow.doi,
  journalConference: paperRow.journal_conference,
  url: paperRow.url,
  pdfStatus: paperRow.pdf_status,
  importSource: paperRow.import_source,
  status: paperRow.status,
  processingPercentage: paperRow.processing_percentage,
  fieldOfKnowledge: paperRow.field_of_knowledge,
  difficultyLevel: paperRow.difficulty_level,
  paperType: paperRow.paper_type,
  tags: paperRow.tags || [],
  readingStatus: paperRow.reading_status,
  notes: paperRow.notes,
  priority: paperRow.priority,
  lastInteraction: paperRow.last_interaction,
  projectId: paperRow.project_id,
  createdAt: paperRow.created_at,
});

// Convert database types to frontend types without additional async calls
// Convert database types to frontend types without additional async calls
export const convertProjectFromDBSync = (
  projectRow: any,
): Project => {
  const atoms = (projectRow.atoms || []).map(convertAtomFromDB);
  const sources = (projectRow.sources || []).map(convertSourceFromDB);
  const learningPath = (projectRow.learning_path_items || []).map(convertLearningPathItemFromDB);

  // Handle sessions with real atom relationships from session_atoms join table
  const sessions = (projectRow.sessions || []).map((sessionData: any) => {
    // Get the IDs of atoms linked to this session
    const linkedAtomIds = (sessionData.session_atoms || []).map((sa: any) => sa.atom_id);

    // Map those IDs back to the actual atom objects (using the index/order if necessary, but here we have the atom objects)
    // Actually, in the frontend types, an Atom doesn't have an 'id'.
    // BUT in the DB row they do. Let's see if convertAtomFromDB includes the id.
    // Looking at convertAtomFromDB below, it doesn't. I'll need to fix that too.
    const sessionAtoms = atoms.filter((atom: any) => linkedAtomIds.includes(atom.id));

    return {
      session: sessionData.session_number,
      type: sessionData.type,
      questions: sessionData.questions || '',
      duration: sessionData.duration,
      status: sessionData.status as 'Completed' | 'Continue' | 'Locked',
      atoms: sessionAtoms.length > 0 ? sessionAtoms : [], // Fallback if no links found
      numAtoms: sessionAtoms.length,
      phase: sessionData.phase as any || undefined,
      questionFormats: sessionData.question_formats || undefined,
    };
  });

  return {
    id: projectRow.id,
    title: projectRow.title,
    description: projectRow.description || '',
    mastery: projectRow.mastery,
    icon: projectRow.icon,
    categories: projectRow.categories,
    bestStreak: projectRow.best_streak,
    totalAnswers: projectRow.total_answers,
    correctAnswers: projectRow.correct_answers,
    isPublic: projectRow.is_public,
    atoms,
    sources,
    sessions,
    learningPath,
    fullLearningPlanMarkdown: projectRow.full_learning_plan_markdown || undefined,
  };
};

export const convertProjectFromDB = async (
  projectRow: ProjectRow,
  includeRelated: boolean = true
): Promise<Project> => {
  const supabase = createClient()

  let atoms: Atom[] = []
  let sources: Source[] = []
  let sessions: Session[] = []
  let learningPath: LearningPathItem[] = []

  if (includeRelated) {
    // Fetch atoms
    const { data: atomsData } = await supabase
      .from('atoms')
      .select('*')
      .eq('project_id', projectRow.id)
      .order('created_at', { ascending: true })

    atoms = atomsData?.map(convertAtomFromDB) || []

    // Fetch sources
    const { data: sourcesData } = await supabase
      .from('sources')
      .select('*')
      .eq('project_id', projectRow.id)
      .order('created_at', { ascending: true })

    sources = sourcesData?.map(convertSourceFromDB) || []

    // Fetch sessions with atom relationships from the start
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*, session_atoms(atom_id)')
      .eq('project_id', projectRow.id)
      .order('session_number', { ascending: true })

    if (sessionsData) {
      sessions = sessionsData.map((sessionData: any) => {
        const linkedAtomIds = (sessionData.session_atoms || []).map((sa: any) => sa.atom_id);
        const sessionAtoms = atoms.filter((atom: any) => linkedAtomIds.includes(atom.id));

        return {
          session: sessionData.session_number,
          type: sessionData.type,
          questions: sessionData.questions || '',
          duration: sessionData.duration,
          status: sessionData.status as 'Completed' | 'Continue' | 'Locked',
          atoms: sessionAtoms,
          numAtoms: sessionAtoms.length,
          phase: sessionData.phase as any || undefined,
          questionFormats: sessionData.question_formats || undefined,
        }
      })
    }

    // Fetch learning path
    const { data: learningPathData } = await supabase
      .from('learning_path_items')
      .select('*')
      .eq('project_id', projectRow.id)
      .order('session_number', { ascending: true })

    learningPath = learningPathData?.map(convertLearningPathItemFromDB) || []
  }

  return {
    id: projectRow.id,
    title: projectRow.title,
    description: projectRow.description || '',
    mastery: projectRow.mastery,
    icon: projectRow.icon,
    categories: projectRow.categories,
    bestStreak: projectRow.best_streak,
    totalAnswers: projectRow.total_answers,
    correctAnswers: projectRow.correct_answers,
    isPublic: projectRow.is_public,
    atoms,
    sources,
    sessions,
    learningPath,
    fullLearningPlanMarkdown: projectRow.full_learning_plan_markdown || undefined,
  }
}

export const convertAtomFromDB = (atomRow: AtomRow): Atom & { id?: string } => ({
  id: atomRow.id,
  question: atomRow.question,
  answer: atomRow.answer,
  difficulty: parseFloat(atomRow.difficulty as any),
  stability: atomRow.stability,
  lastReviewed: atomRow.last_reviewed || undefined,
  retrievability: atomRow.retrievability || undefined,
  incorrectAnswers: atomRow.incorrect_answers,
  phase: atomRow.phase as any || undefined,
  zettelkastenNote: atomRow.zettelkasten_note || undefined,
  dependencies: atomRow.dependencies || undefined,
  orderingItems: atomRow.ordering_items || undefined,
  correctOrder: atomRow.correct_order || undefined,
})

export const convertSourceFromDB = (sourceRow: SourceRow): Source => ({
  id: sourceRow.id,
  name: sourceRow.name,
  type: sourceRow.type,
  content: (sourceRow as any).content || 'FETCH_REQUIRED', // content is excluded from main query to prevent memory crash
})

export const convertLearningPathItemFromDB = (lpRow: LearningPathRow): LearningPathItem => ({
  session: lpRow.session_number,
  topic: lpRow.topic,
  sessionType: lpRow.session_type,
  questions: lpRow.questions,
  phase: lpRow.phase as any || undefined,
  questionFormats: lpRow.question_formats || undefined,
})

// Database operations
export class ProjectDatabase {
  private supabase = createClient()

  async getProjects(userId: string): Promise<Project[]> {
    console.log('[DB] Getting projects for user:', userId);
    const { data, error } = await this.supabase
      .from('projects')
      .select('*, atoms(*), sources(id, name, type), sessions(*, session_atoms(atom_id)), learning_path_items(*)')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .eq('is_completed', false)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[DB] ❌ Failed to get projects:', error);
      throw error;
    }

    console.log(`[DB] ✅ Found ${data.length} projects in database`);
    const projects = (data || []).map(project => convertProjectFromDBSync(project));
    console.log(`[DB] ✅ Converted ${projects.length} projects`);
    return projects;
  }

  async getCompletedProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*, atoms(*), sources(id, name, type), sessions(*, session_atoms(atom_id)), learning_path_items(*)')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return (data || []).map(project => convertProjectFromDBSync(project));
  }

  async getArchivedProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*, atoms(*), sources(id, name, type), sessions(*, session_atoms(atom_id)), learning_path_items(*)')
      .eq('user_id', userId)
      .eq('is_archived', true)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return (data || []).map(project => convertProjectFromDBSync(project));
  }

  async getSourceContent(sourceId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('sources')
      .select('content')
      .eq('id', sourceId)
      .single()

    if (error) throw error
    return data.content || '';
  }

  async createProject(userId: string, project: Omit<Project, 'id'>, log?: (msg: string) => void): Promise<string> {
    const logDb = (msg: string) => {
      console.log(`[DB] ${msg}`);
      if (log) log(`> ${msg}`);
    };

    logDb('Creating project...');

    // Create the project
    const { data: projectData, error: projectError } = await this.supabase
      .from('projects')
      .insert({
        user_id: userId,
        title: project.title,
        description: project.description,
        mastery: project.mastery,
        icon: project.icon,
        categories: project.categories,
        best_streak: project.bestStreak || 0,
        total_answers: project.totalAnswers || 0,
        correct_answers: project.correctAnswers || 0,
        is_public: project.isPublic || false,
        full_learning_plan_markdown: project.fullLearningPlanMarkdown,
      })
      .select('id')
      .single()

    if (projectError) {
      logDb(`❌ Failed to create project: ${projectError.message}`);
      throw projectError;
    }

    const projectId = projectData.id
    logDb(`✅ Project created with ID: ${projectId}`);

    // Create atoms
    if (project.atoms.length > 0) {
      logDb(`Inserting ${project.atoms.length} atoms...`);
      const { data: createdAtoms, error: atomsError } = await this.supabase
        .from('atoms')
        .insert(
          project.atoms.map(atom => ({
            project_id: projectId,
            question: atom.question,
            answer: atom.answer,
            difficulty: atom.difficulty || 0.3,
            stability: atom.stability || 0,
            last_reviewed: atom.lastReviewed,
            retrievability: atom.retrievability,
            incorrect_answers: atom.incorrectAnswers || [],
            phase: atom.phase || 'calibration',
            zettelkasten_note: atom.zettelkastenNote,
            dependencies: atom.dependencies,
            ordering_items: atom.orderingItems,
            correct_order: atom.correctOrder,
          }))
        )
        .select('id, question');

      if (atomsError) {
        logDb(`❌ Failed to insert atoms: ${atomsError.message}`);
        throw atomsError;
      }
      logDb(`✅ ${createdAtoms?.length} atoms inserted`);

      // Store created atoms for mapping to sessions
      const atomMap = new Map();
      createdAtoms?.forEach(a => {
        atomMap.set(a.question, a.id);
      });

      // Create sessions
      if (project.sessions && project.sessions.length > 0) {
        logDb(`Inserting ${project.sessions.length} sessions...`);
        const { data: sessionsData, error: sessionsError } = await this.supabase
          .from('sessions')
          .insert(
            project.sessions.map(session => ({
              project_id: projectId,
              session_number: session.session,
              type: session.type,
              questions: session.questions,
              duration: session.duration,
              status: session.status,
              phase: session.phase || 'calibration',
              question_formats: session.questionFormats,
            }))
          )
          .select('id, session_number');

        if (sessionsError) {
          logDb(`❌ Failed to insert sessions: ${sessionsError.message}`);
          throw sessionsError;
        }
        logDb(`✅ Sessions inserted`);

        // Create session-atom relationships
        const sessionAtomInserts: any[] = [];
        project.sessions.forEach(session => {
          const sessionData = sessionsData?.find(s => s.session_number === session.session);
          if (sessionData && session.atoms.length > 0) {
            session.atoms.forEach(atom => {
              const atomId = atomMap.get(atom.question);
              if (atomId) {
                sessionAtomInserts.push({
                  session_id: sessionData.id,
                  atom_id: atomId,
                });
              }
            });
          }
        });

        if (sessionAtomInserts.length > 0) {
          logDb(`Linking ${sessionAtomInserts.length} atoms to sessions...`);
          const { error: linkError } = await this.supabase
            .from('session_atoms')
            .insert(sessionAtomInserts);
          if (linkError) {
            logDb(`⚠️ Failed to link atoms to sessions: ${linkError.message}`);
          } else {
            logDb(`✅ Atoms linked to sessions`);
          }
        }
      }
    }

    // Create sources
    if (project.sources.length > 0) {
      logDb(`Inserting ${project.sources.length} sources...`);
      const { error: sourcesError } = await this.supabase
        .from('sources')
        .insert(
          project.sources.map(source => ({
            project_id: projectId,
            name: source.name,
            type: source.type,
            content: source.content,
          }))
        )

      if (sourcesError) {
        logDb(`❌ Failed to insert sources: ${sourcesError.message}`);
        throw sourcesError;
      }
      logDb(`✅ Sources inserted`);
    }

    // Create learning path
    if (project.learningPath.length > 0) {
      logDb(`Inserting ${project.learningPath.length} learning path items...`);
      const { error: learningPathError } = await this.supabase
        .from('learning_path_items')
        .insert(
          project.learningPath.map(item => ({
            project_id: projectId,
            session_number: item.session,
            topic: item.topic,
            session_type: item.sessionType,
            questions: item.questions,
            phase: item.phase || 'calibration',
            question_formats: item.questionFormats,
          }))
        )

      if (learningPathError) {
        logDb(`❌ Failed to insert learning path: ${learningPathError.message}`);
        throw learningPathError;
      }
      logDb(`✅ Learning path inserted`);
    }
    logDb(`✅✅✅ Project creation COMPLETE. ID: ${projectId}`);
    return projectId;
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .update({
        title: updates.title,
        description: updates.description,
        mastery: updates.mastery,
        icon: updates.icon,
        categories: updates.categories,
        best_streak: updates.bestStreak,
        total_answers: updates.totalAnswers,
        correct_answers: updates.correctAnswers,
        is_public: updates.isPublic,
        full_learning_plan_markdown: updates.fullLearningPlanMarkdown,
      })
      .eq('id', projectId)

    if (error) throw error
  }

  async updateLearningPathAndSessions(projectId: string, learningPath: LearningPathItem[], sessions: Session[]): Promise<void> {
    // 1. Fetch current atoms to get their IDs for re-linking
    const { data: atomsData, error: atomsError } = await this.supabase
      .from('atoms')
      .select('id, question')
      .eq('project_id', projectId);

    if (atomsError) throw new Error(`Failed to fetch atoms for re-linking: ${atomsError.message}`);

    const atomMap = new Map();
    atomsData.forEach(a => atomMap.set(a.question, a.id));

    // 2. Transactional operation: delete old items, then insert new ones
    // Delete old learning path items
    const { error: deleteLpError } = await this.supabase
      .from('learning_path_items')
      .delete()
      .eq('project_id', projectId);
    if (deleteLpError) throw new Error(`Failed to delete old learning path: ${deleteLpError.message}`);

    // Delete old sessions (this will cascade delete session_atoms links due to FK)
    const { error: deleteSessionsError } = await this.supabase
      .from('sessions')
      .delete()
      .eq('project_id', projectId);
    if (deleteSessionsError) throw new Error(`Failed to delete old sessions: ${deleteSessionsError.message}`);

    // 3. Insert new learning path items
    if (learningPath.length > 0) {
      const lpToInsert = learningPath.map(item => ({
        project_id: projectId,
        session_number: item.session,
        topic: item.topic,
        session_type: item.sessionType,
        questions: item.questions,
        phase: item.phase || 'calibration',
        question_formats: item.questionFormats,
      }));
      const { error: insertLpError } = await this.supabase.from('learning_path_items').insert(lpToInsert);
      if (insertLpError) throw new Error(`Failed to insert new learning path: ${insertLpError.message}`);
    }

    // 4. Insert new sessions
    if (sessions.length > 0) {
      const sessionsToInsert = sessions.map(session => ({
        project_id: projectId,
        session_number: session.session,
        type: session.type,
        duration: session.duration,
        status: session.status,
        phase: session.phase || 'calibration',
        question_formats: session.questionFormats,
      }));
      const { data: insertedSessions, error: insertSessionsError } = await this.supabase
        .from('sessions')
        .insert(sessionsToInsert)
        .select('id, session_number');

      if (insertSessionsError) throw new Error(`Failed to insert new sessions: ${insertSessionsError.message}`);

      // 5. Re-link atoms to the newly inserted sessions
      const sessionAtomInserts: any[] = [];
      sessions.forEach(session => {
        const sessionRow = insertedSessions?.find(s => s.session_number === session.session);
        if (sessionRow && session.atoms && session.atoms.length > 0) {
          session.atoms.forEach(atom => {
            const atomId = atomMap.get(atom.question);
            if (atomId) {
              sessionAtomInserts.push({
                session_id: sessionRow.id,
                atom_id: atomId,
              });
            }
          });
        }
      });

      if (sessionAtomInserts.length > 0) {
        const { error: linkError } = await this.supabase
          .from('session_atoms')
          .insert(sessionAtomInserts);
        if (linkError) {
          console.error(`⚠️ Failed to re-link atoms to sessions: ${linkError.message}`);
          // Don't throw here to avoid failing the whole sync if only linking fails, 
          // but in production we might want more robust handling.
        }
      }
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) throw error
  }

  async archiveProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', projectId)

    if (error) throw error
  }

  async unarchiveProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .update({ is_archived: false })
      .eq('id', projectId)

    if (error) throw error
  }

  async completeProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .update({ is_completed: true })
      .eq('id', projectId)

    if (error) throw error
  }

  async updateAtom(projectId: string, atom: Atom & { id?: string }): Promise<void> {
    if (atom.id) {
      // Update existing atom
      const { error } = await this.supabase
        .from('atoms')
        .update({
          question: atom.question,
          answer: atom.answer,
          difficulty: atom.difficulty,
          stability: atom.stability,
          last_reviewed: atom.lastReviewed,
          retrievability: atom.retrievability,
          incorrect_answers: atom.incorrectAnswers || [],
          phase: atom.phase,
          zettelkasten_note: atom.zettelkastenNote,
          dependencies: atom.dependencies,
          ordering_items: atom.orderingItems,
          correct_order: atom.correctOrder,
        })
        .eq('id', atom.id)

      if (error) throw error
    } else {
      // Create new atom
      const { error } = await this.supabase
        .from('atoms')
        .insert({
          project_id: projectId,
          question: atom.question,
          answer: atom.answer,
          difficulty: atom.difficulty || 0.3,
          stability: atom.stability || 0,
          last_reviewed: atom.lastReviewed,
          retrievability: atom.retrievability,
          incorrect_answers: atom.incorrectAnswers || [],
          phase: atom.phase || 'calibration',
          zettelkasten_note: atom.zettelkastenNote,
          dependencies: atom.dependencies,
        })

      if (error) throw error
    }
  }

  async addAtoms(projectId: string, atoms: Atom[]): Promise<void> {
    if (atoms.length === 0) return;

    const { error } = await this.supabase
      .from('atoms')
      .insert(
        atoms.map(atom => ({
          project_id: projectId,
          question: atom.question,
          answer: atom.answer,
          difficulty: atom.difficulty || 0.3,
          stability: atom.stability || 0,
          last_reviewed: atom.lastReviewed,
          retrievability: atom.retrievability,
          incorrect_answers: atom.incorrectAnswers || [],
          phase: atom.phase || 'calibration',
          zettelkasten_note: atom.zettelkastenNote,
          dependencies: atom.dependencies,
          ordering_items: atom.orderingItems,
          correct_order: atom.correctOrder,
        }))
      )

    if (error) throw error
  }

  async updateAtoms(projectId: string, atoms: Atom[]): Promise<void> {
    if (atoms.length === 0) return;

    // We use an upsert with the unique constraint on (project_id, question)
    // or we'd need the UUIDs. Since we have questions, we can use those as keys if they are unique per project.
    // In our schema, atoms belong to projects.

    const { error } = await this.supabase
      .from('atoms')
      .upsert(
        atoms.map(atom => ({
          project_id: projectId,
          question: atom.question,
          answer: atom.answer,
          difficulty: atom.difficulty,
          stability: atom.stability,
          last_reviewed: atom.lastReviewed,
          retrievability: atom.retrievability,
          incorrect_answers: atom.incorrectAnswers || [],
          phase: atom.phase,
          zettelkasten_note: atom.zettelkastenNote,
          dependencies: atom.dependencies,
          ordering_items: atom.orderingItems,
          correct_order: atom.correctOrder,
        })),
        { onConflict: 'project_id,question' }
      )

    if (error) throw error
  }

  async addSessions(projectId: string, sessions: Session[]): Promise<void> {
    if (sessions.length === 0) return;

    const { error } = await this.supabase
      .from('sessions')
      .insert(
        sessions.map(session => ({
          project_id: projectId,
          session_number: session.session,
          type: session.type,
          questions: session.questions,
          duration: session.duration,
          status: session.status,
          phase: session.phase || 'calibration',
          question_formats: session.questionFormats,
        }))
      )

    if (error) throw error
  }

  // Paper Box Operations
  async getPapers(userId: string): Promise<Paper[]> {
    const { data, error } = await this.supabase
      .from('papers')
      .select('*')
      .eq('user_id', userId)
      .order('last_interaction', { ascending: false });

    if (error) throw error;
    return (data || []).map(convertPaperFromDB);
  }

  async createPaper(userId: string, paper: Omit<Paper, 'id' | 'createdAt' | 'lastInteraction'>): Promise<string> {
    console.log('[DB] Preparing to insert paper into Supabase:', { userId, title: paper.title });
    try {
      const { data, error } = await this.supabase
        .from('papers')
        .insert({
          user_id: userId,
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          doi: paper.doi,
          journal_conference: paper.journalConference,
          url: paper.url,
          pdf_status: paper.pdfStatus,
          import_source: paper.importSource,
          status: paper.status,
          processing_percentage: paper.processingPercentage,
          field_of_knowledge: paper.fieldOfKnowledge,
          difficulty_level: paper.difficultyLevel,
          paper_type: paper.paperType,
          tags: paper.tags,
          reading_status: paper.readingStatus,
          notes: paper.notes,
          priority: paper.priority,
          project_id: paper.projectId,
        })
        .select('id')
        .single();

      console.log('[DB] Supabase insert response:', { data, error });

      if (error) throw error;
      return data.id;
    } catch (e) {
      console.error('[DB] Exception in createPaper:', e);
      throw e;
    }
  }

  async updatePaper(paperId: string, updates: Partial<Paper>): Promise<void> {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.authors !== undefined) dbUpdates.authors = updates.authors;
    if (updates.year !== undefined) dbUpdates.year = updates.year;
    if (updates.doi !== undefined) dbUpdates.doi = updates.doi;
    if (updates.journalConference !== undefined) dbUpdates.journal_conference = updates.journalConference;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.pdfStatus !== undefined) dbUpdates.pdf_status = updates.pdfStatus;
    if (updates.importSource !== undefined) dbUpdates.import_source = updates.importSource;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.processingPercentage !== undefined) dbUpdates.processing_percentage = updates.processingPercentage;
    if (updates.fieldOfKnowledge !== undefined) dbUpdates.field_of_knowledge = updates.fieldOfKnowledge;
    if (updates.difficultyLevel !== undefined) dbUpdates.difficulty_level = updates.difficultyLevel;
    if (updates.paperType !== undefined) dbUpdates.paper_type = updates.paperType;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.readingStatus !== undefined) dbUpdates.reading_status = updates.readingStatus;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;

    dbUpdates.last_interaction = new Date().toISOString();

    const { error } = await this.supabase
      .from('papers')
      .update(dbUpdates)
      .eq('id', paperId);

    if (error) throw error;
  }

  async deletePaper(paperId: string): Promise<void> {
    const { error } = await this.supabase
      .from('papers')
      .delete()
      .eq('id', paperId);

    if (error) throw error;
  }
}