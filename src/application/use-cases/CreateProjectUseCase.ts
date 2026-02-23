import { IProjectRepository } from '../../core/ports/outbound/IProjectRepository';
import { Project, Session } from '../../core/domain/models/project';
import { User } from '../../core/domain/models/user';

export class CreateProjectUseCase {
    constructor(private projectRepository: IProjectRepository) { }

    async execute(
        userId: string | null,
        projectToAdd: Project,
        logCallback?: (msg: string) => void
    ): Promise<Project> {

        // 1. Ensure calibration session logic
        const ensureCalibrationSession = (project: Project): Project => {
            if (project.sessions && project.sessions.length > 0) {
                return project;
            }

            const sessionSize = 10;

            if (project.learningPath && project.learningPath.length > 0) {
                const sessions: Session[] = project.learningPath.map((item, index) => {
                    let sessionAtoms = (item as any).atoms || [];

                    if (sessionAtoms.length === 0) {
                        sessionAtoms = project.atoms.slice(index * sessionSize, (index + 1) * sessionSize);
                    }

                    return {
                        session: item.session,
                        type: item.sessionType,
                        questions: item.questions,
                        duration: '20 min',
                        status: index === 0 ? 'Continue' : 'Locked' as const,
                        atoms: sessionAtoms,
                        phase: item.phase,
                        questionFormats: item.questionFormats,
                    };
                });
                return { ...project, sessions };
            }

            const calibrationSession: Session = {
                session: 1,
                type: 'Initial Calibration',
                questions: `${Math.min(sessionSize, project.atoms.length)} calibration questions`,
                duration: '20 min',
                status: 'Continue',
                atoms: project.atoms.slice(0, sessionSize),
                phase: 'calibration',
                questionFormats: 'Multiple Choice',
            };

            return { ...project, sessions: [calibrationSession] };
        };

        const projectWithSessions = ensureCalibrationSession(projectToAdd);

        // 2. Persist Project
        if (userId) {
            try {
                if (logCallback) logCallback('Saving to Supabase (from Use Case)...');
                const projectId = await this.projectRepository.createProject(userId, projectWithSessions, logCallback);

                // Return project with true ID
                return { ...projectWithSessions, id: projectId };
            } catch (error) {
                console.error('[CreateProjectUseCase] Save error:', error);
                throw error;
            }
        } else {
            // Local mode fallback
            return projectWithSessions;
        }
    }
}
