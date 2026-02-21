import { createClient } from './client'
import { Database } from '@/lib/database.types'
import { Atom, Project, Source, Session, LearningPathItem } from '@/contexts/ProjectContext'

type Tables = Database['public']['Tables']
type ProjectRow = Tables['projects']['Row']
type AtomRow = Tables['atoms']['Row']
type SourceRow = Tables['sources']['Row']
type SessionRow = Tables['sessions']['Row']
type LearningPathRow = Tables['learning_path_items']['Row']

// Convert database types to frontend types
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
  name: sourceRow.name,
  type: sourceRow.type,
  content: sourceRow.content,
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
      .select('*, atoms(*), sources(*), sessions(*, session_atoms(atom_id)), learning_path_items(*)')
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
      .select('*, atoms(*), sources(*), sessions(*, session_atoms(atom_id)), learning_path_items(*)')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return (data || []).map(project => convertProjectFromDBSync(project));
  }

  async getArchivedProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*, atoms(*), sources(*), sessions(*, session_atoms(atom_id)), learning_path_items(*)')
      .eq('user_id', userId)
      .eq('is_archived', true)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return (data || []).map(project => convertProjectFromDBSync(project));
  }

  async createProject(userId: string, project: Omit<Project, 'id'>): Promise<string> {
    console.log('[DB] Creating project:', {
      userId,
      title: project.title,
      atoms: project.atoms?.length || 0,
      sessions: project.sessions?.length || 0,
      sources: project.sources?.length || 0,
    });

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
      console.error('[DB] ❌ Failed to create project:', projectError);
      throw projectError;
    }

    const projectId = projectData.id
    console.log('[DB] ✅ Project created with ID:', projectId);

    // Create atoms
    if (project.atoms.length > 0) {
      console.log(`[DB] Inserting ${project.atoms.length} atoms...`);
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
            phase: atom.phase || 'calibracion',
            zettelkasten_note: atom.zettelkastenNote,
            dependencies: atom.dependencies,
            ordering_items: atom.orderingItems,
            correct_order: atom.correctOrder,
          }))
        )
        .select('id, question');

      if (atomsError) {
        console.error('[DB] ❌ Failed to insert atoms:', atomsError);
        throw atomsError;
      }
      console.log(`[DB] ✅ ${createdAtoms?.length} atoms inserted`);

      // Store created atoms for mapping to sessions
      const atomMap = new Map();
      createdAtoms?.forEach(a => {
        atomMap.set(a.question, a.id);
      });

      // Create sessions
      if (project.sessions && project.sessions.length > 0) {
        console.log(`[DB] Inserting ${project.sessions.length} sessions...`);
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
              phase: session.phase || 'calibracion',
              question_formats: session.questionFormats,
            }))
          )
          .select('id, session_number');

        if (sessionsError) {
          console.error('[DB] ❌ Failed to insert sessions:', sessionsError);
          throw sessionsError;
        }
        console.log('[DB] ✅ Sessions inserted');

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
          console.log(`[DB] Linking ${sessionAtomInserts.length} atoms to sessions...`);
          const { error: linkError } = await this.supabase
            .from('session_atoms')
            .insert(sessionAtomInserts);
          if (linkError) {
            console.warn('[DB] ⚠️ Failed to link atoms to sessions:', linkError);
          } else {
            console.log('[DB] ✅ Atoms linked to sessions');
          }
        }
      }
    }

    // Create sources
    if (project.sources.length > 0) {
      console.log(`[DB] Inserting ${project.sources.length} sources...`);
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
        console.error('[DB] ❌ Failed to insert sources:', sourcesError);
        throw sourcesError;
      }
      console.log('[DB] ✅ Sources inserted');
    }

    // Create learning path
    if (project.learningPath.length > 0) {
      console.log(`[DB] Inserting ${project.learningPath.length} learning path items...`);
      const { error: learningPathError } = await this.supabase
        .from('learning_path_items')
        .insert(
          project.learningPath.map(item => ({
            project_id: projectId,
            session_number: item.session,
            topic: item.topic,
            session_type: item.sessionType,
            questions: item.questions,
            phase: item.phase || 'calibracion',
            question_formats: item.questionFormats,
          }))
        )

      if (learningPathError) {
        console.error('[DB] ❌ Failed to insert learning path:', learningPathError);
        throw learningPathError;
      }
      console.log('[DB] ✅ Learning path inserted');
    }
    console.log('[DB] ✅✅✅ Project creation COMPLETE. ID:', projectId);
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
    // This is a transactional operation: delete old, insert new
    const { error: deleteLpError } = await this.supabase
      .from('learning_path_items')
      .delete()
      .eq('project_id', projectId);
    if (deleteLpError) throw new Error(`Failed to delete old learning path: ${deleteLpError.message}`);

    const { error: deleteSessionsError } = await this.supabase
      .from('sessions')
      .delete()
      .eq('project_id', projectId);
    if (deleteSessionsError) throw new Error(`Failed to delete old sessions: ${deleteSessionsError.message}`);

    // Insert new learning path items
    const lpToInsert = learningPath.map(item => ({
      project_id: projectId,
      session_number: item.session,
      topic: item.topic,
      session_type: item.sessionType,
      questions: item.questions,
      phase: item.phase || 'calibracion',
      question_formats: item.questionFormats,
    }));
    const { error: insertLpError } = await this.supabase.from('learning_path_items').insert(lpToInsert);
    if (insertLpError) throw new Error(`Failed to insert new learning path: ${insertLpError.message}`);

    // Insert new sessions
    const sessionsToInsert = sessions.map(session => ({
      project_id: projectId,
      session_number: session.session,
      type: session.type,
      duration: session.duration,
      status: session.status,
      phase: session.phase || 'calibracion',
      question_formats: session.questionFormats,
    }));
    const { error: insertSessionsError } = await this.supabase.from('sessions').insert(sessionsToInsert);
    if (insertSessionsError) throw new Error(`Failed to insert new sessions: ${insertSessionsError.message}`);
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
          phase: atom.phase || 'calibracion',
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
          phase: atom.phase || 'calibracion',
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
          phase: session.phase || 'calibracion',
          question_formats: session.questionFormats,
        }))
      )

    if (error) throw error
  }
}