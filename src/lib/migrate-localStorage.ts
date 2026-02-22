import { Project } from '@/contexts/ProjectContext'
import { ProjectDatabase } from '@/lib/supabase/database'
import { createClient } from '@/lib/supabase/client'

interface LocalStorageData {
  projects: Project[]
  completedProjects: Project[]
  archivedProjects: Project[]
  userData?: {
    name: string
    email: string
    profession?: string
    company?: string
    age?: string
    additionalInfo?: string
  }
}

export async function migrateLocalStorageToSupabase(): Promise<{
  success: boolean
  migratedProjects: number
  errors: string[]
}> {
  const supabase = createClient()
  const projectDb = new ProjectDatabase()
  const errors: string[] = []
  let migratedProjects = 0

  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User must be authenticated to migrate data')
    }

    // Get localStorage data
    const localData = getLocalStorageData()
    if (!localData) {
      return { success: true, migratedProjects: 0, errors: ['No localStorage data found'] }
    }

    // Migrate user profile data if available
    if (localData.userData) {
      try {
        await supabase
          .from('profiles')
          .update({
            profession: localData.userData.profession,
            company: localData.userData.company,
            age: localData.userData.age,
            additional_info: localData.userData.additionalInfo,
          })
          .eq('id', user.id)
      } catch (error) {
        errors.push(`Failed to migrate user profile: ${error}`)
      }
    }

    // Migrate projects
    const allProjects = [
      ...localData.projects,
      ...localData.completedProjects.map(p => ({ ...p, isCompleted: true })),
      ...localData.archivedProjects.map(p => ({ ...p, isArchived: true }))
    ]

    for (const project of allProjects) {
      try {
        // Check if project already exists in database
        const { data: existingProject } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', project.title)
          .single()

        if (existingProject) {
          console.log(`Project "${project.title}" already exists in database, skipping...`)
          continue
        }

        // Create project in database
        const projectData = {
          ...project,
          isCompleted: (project as any).isCompleted || false,
          isArchived: (project as any).isArchived || false,
        }

        await projectDb.createProject(user.id, projectData)
        migratedProjects++

        console.log(`Migrated project: ${project.title}`)
      } catch (error) {
        const errorMsg = `Failed to migrate project "${project.title}": ${error}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Clear localStorage after successful migration
    if (migratedProjects > 0 && errors.length === 0) {
      clearLocalStorageData()
      console.log('localStorage data cleared after successful migration')
    }

    return {
      success: errors.length === 0,
      migratedProjects,
      errors
    }

  } catch (error) {
    const errorMsg = `Migration failed: ${error}`
    errors.push(errorMsg)
    console.error(errorMsg)

    return {
      success: false,
      migratedProjects,
      errors
    }
  }
}

function getLocalStorageData(): LocalStorageData | null {
  try {
    const projects = localStorage.getItem('learningbox_projects')
    const completedProjects = localStorage.getItem('learningbox_completed_projects')
    const archivedProjects = localStorage.getItem('learningbox_archived_projects')
    const user = localStorage.getItem('learningbox_user')

    return {
      projects: projects ? JSON.parse(projects) : [],
      completedProjects: completedProjects ? JSON.parse(completedProjects) : [],
      archivedProjects: archivedProjects ? JSON.parse(archivedProjects) : [],
      userData: user ? JSON.parse(user) : undefined
    }
  } catch (error) {
    console.error('Failed to parse localStorage data:', error)
    return null
  }
}

function clearLocalStorageData(): void {
  const keys = [
    'learningbox_projects',
    'learningbox_completed_projects',
    'learningbox_archived_projects',
    'learningbox_user',
    'learningbox_users' // Old user list
  ]

  keys.forEach(key => {
    localStorage.removeItem(key)
  })
}

// Utility function to check if there's data to migrate
export function hasLocalStorageData(): boolean {
  try {
    const projects = localStorage.getItem('learningbox_projects')
    const completedProjects = localStorage.getItem('learningbox_completed_projects')
    const archivedProjects = localStorage.getItem('learningbox_archived_projects')

    const hasProjects = !!(projects && JSON.parse(projects).length > 0)
    const hasCompleted = !!(completedProjects && JSON.parse(completedProjects).length > 0)
    const hasArchived = !!(archivedProjects && JSON.parse(archivedProjects).length > 0)

    return hasProjects || hasCompleted || hasArchived
  } catch (error) {
    return false
  }
}