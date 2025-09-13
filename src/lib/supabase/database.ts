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

    // Fetch sessions with their atoms
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select(`
        *,
        session_atoms(atom_id)
      `)
      .eq('project_id', projectRow.id)
      .order('session_number', { ascending: true })

    if (sessionsData) {
      sessions = await Promise.all(
        sessionsData.map(async (sessionData: any) => {
          const sessionAtoms = sessionData.session_atoms?.map((sa: any) => 
            atoms.find(atom => atom.question === atoms.find(a => a.question)?.question) // This needs to be improved
          ).filter(Boolean) || []

          return {
            session: sessionData.session_number,
            type: sessionData.type,
            questions: sessionData.questions || '',
            duration: sessionData.duration,
            status: sessionData.status as 'Completed' | 'Continue' | 'Locked',
            atoms: sessionAtoms,
            numAtoms: sessionAtoms.length,
          }
        })
      )
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

export const convertAtomFromDB = (atomRow: AtomRow): Atom => ({
  question: atomRow.question,
  answer: atomRow.answer,
  difficulty: atomRow.difficulty,
  stability: atomRow.stability,
  lastReviewed: atomRow.last_reviewed || undefined,
  retrievability: atomRow.retrievability || undefined,
  incorrectAnswers: atomRow.incorrect_answers,
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
})

// Database operations
export class ProjectDatabase {
  private supabase = createClient()

  async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .eq('is_completed', false)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return Promise.all(
      data.map(project => convertProjectFromDB(project, true))
    )
  }

  async getCompletedProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return Promise.all(
      data.map(project => convertProjectFromDB(project, true))
    )
  }

  async getArchivedProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', true)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return Promise.all(
      data.map(project => convertProjectFromDB(project, true))
    )
  }

  async createProject(userId: string, project: Omit<Project, 'id'>): Promise<string> {
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

    if (projectError) throw projectError

    const projectId = projectData.id

    // Create atoms
    if (project.atoms.length > 0) {
      const { error: atomsError } = await this.supabase
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
            incorrect_answers: atom.incorrectAnswers || [], // <-- VERIFICA Y ASEGURA QUE ESTA LÍNEA ESTÉ ASÍ
          }))
        )

      if (atomsError) throw atomsError
    }

    // Create sources
    if (project.sources.length > 0) {
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

      if (sourcesError) throw sourcesError
    }

    // Create learning path
    if (project.learningPath.length > 0) {
      const { error: learningPathError } = await this.supabase
        .from('learning_path_items')
        .insert(
          project.learningPath.map(item => ({
            project_id: projectId,
            session_number: item.session,
            topic: item.topic,
            session_type: item.sessionType,
            questions: item.questions,
          }))
        )

      if (learningPathError) throw learningPathError
    }

    // Create sessions
    if (project.sessions.length > 0) {
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
          }))
        )
        .select('id, session_number')

      if (sessionsError) throw sessionsError

      // Create session-atom relationships
      const sessionAtomInserts: any[] = []
      project.sessions.forEach(session => {
        const sessionData = sessionsData.find(s => s.session_number === session.session)
        if (sessionData && session.atoms.length > 0) {
          session.atoms.forEach(atom => {
            // Find the atom ID from the created atoms
            // This is a simplified approach - in a real app you'd need to track atom IDs better
            sessionAtomInserts.push({
              session_id: sessionData.id,
              // atom_id: atomId, // This needs to be properly handled
            })
          })
        }
      })
    }

    return projectId
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
        })

      if (error) throw error
    }
  }
}