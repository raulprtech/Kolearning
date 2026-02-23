import { IProjectRepository } from '../../core/ports/outbound/IProjectRepository';
import { Project, Session, LearningPathItem } from '../../core/domain/models/project';
import { calculateMastery } from '../../core/domain/mastery';
import { differenceInDays } from 'date-fns';

/**
 * Interface for AI dependencies that we won't inject fully yet but we'll mock or import.
 * Long term, this should live inside ILLMService as recalibrateLearningPath.
 */
interface IStrategicTutor {
    adjustPath(params: {
        fsrsData: string;
        performanceHistory: string;
        currentLearningPlan: string;
        tutorLog: string;
    }): Promise<any>;
}

export class StudySessionUseCase {
    constructor(
        private projectRepository: IProjectRepository,
        private strategicTutor: IStrategicTutor
    ) { }

    /**
     * Completes a session, recalculates FSRS/mastery, syncs with DB if online,
     * and triggers a background AI path calibration.
     * Returns the updated Project so the UI can update local state.
     */
    async execute(
        userId: string | null,
        project: Project,
        sessionIndex: number,
        sessionAnswers: boolean[],
        sessionStreak: number,
        addSessionsCallback: (newSessions: any[], index: number) => void
    ): Promise<{ updatedProject: Project; isFullyCompleted: boolean }> {

        const updatedSessions = [...project.sessions];
        if (updatedSessions[sessionIndex]) {
            updatedSessions[sessionIndex].status = 'Completed';
        }
        if (updatedSessions[sessionIndex + 1]) {
            updatedSessions[sessionIndex + 1].status = 'Continue';
        }

        const sessionCorrectAnswers = sessionAnswers.filter(a => a).length;
        const newTotalAnswers = (project.totalAnswers || 0) + sessionAnswers.length;
        const newCorrectAnswers = (project.correctAnswers || 0) + sessionCorrectAnswers;
        const newBestStreak = Math.max(project.bestStreak || 0, sessionStreak);
        const newMastery = calculateMastery(project.atoms);

        const projectToUpdate: Project = {
            ...project,
            sessions: updatedSessions,
            totalAnswers: newTotalAnswers,
            correctAnswers: newCorrectAnswers,
            bestStreak: newBestStreak,
            mastery: newMastery,
        };

        const isFullyCompleted = projectToUpdate.sessions.every(
            s => s.status === 'Completed' || s.type === "Refuerzo de Dominio"
        );

        // 1. Sync to Storage
        if (userId) {
            try {
                if (isFullyCompleted) {
                    await this.projectRepository.completeProject(projectToUpdate.id);
                    console.log(`[StudySessionUseCase] ✅ Project ${projectToUpdate.id} marked as completed in DB`);
                }

                await this.projectRepository.updateProject(projectToUpdate.id, {
                    totalAnswers: projectToUpdate.totalAnswers,
                    correctAnswers: projectToUpdate.correctAnswers,
                    bestStreak: projectToUpdate.bestStreak,
                    mastery: projectToUpdate.mastery,
                });

                await this.projectRepository.updateLearningPathAndSessions(
                    projectToUpdate.id,
                    projectToUpdate.learningPath,
                    projectToUpdate.sessions
                );

                await this.projectRepository.updateAtoms(projectToUpdate.id, projectToUpdate.atoms);
                console.log(`[StudySessionUseCase] ✅ Session ${sessionIndex} synchronized to DB`);
            } catch (error) {
                console.error('[StudySessionUseCase] ❌ DB Sync failed:', error);
            }
        }

        // 2. Trigger AI Strategic Tutor in the background (fire and forget pattern)
        if (sessionAnswers.length > 0) {
            this.triggerStrategicTutor(projectToUpdate, sessionAnswers, sessionStreak, sessionIndex, addSessionsCallback).catch(e => {
                console.error("[StudySessionUseCase] Background AI adjustment error:", e);
            });
        }

        return { updatedProject: projectToUpdate, isFullyCompleted };
    }

    private async triggerStrategicTutor(
        project: Project,
        sessionAnswers: boolean[],
        sessionStreak: number,
        sessionIndex: number,
        addSessionsCallback: (newSessions: any[], index: number) => void
    ) {
        const fsrsData = JSON.stringify({
            atoms: project.atoms.map((atom, index) => ({
                index,
                question: atom.question.substring(0, 100),
                difficulty: atom.difficulty || 0.3,
                stability: atom.stability || 0,
                retrievability: atom.retrievability || 1,
                lastReviewed: atom.lastReviewed,
                daysSinceLastReview: atom.lastReviewed
                    ? differenceInDays(new Date(), new Date(atom.lastReviewed))
                    : 0
            })),
            currentSessionPerformance: {
                correctAnswers: sessionAnswers.filter(a => a).length,
                totalAnswers: sessionAnswers.length,
                accuracy: sessionAnswers.length > 0
                    ? (sessionAnswers.filter(a => a).length / sessionAnswers.length) * 100
                    : 0,
                sessionStreak
            }
        });

        const performanceHistory = JSON.stringify({
            totalAnswers: project.totalAnswers || 0,
            correctAnswers: project.correctAnswers || 0,
            bestStreak: project.bestStreak || 0,
            mastery: project.mastery || 0,
            lastSessionAccuracy: sessionAnswers.length > 0
                ? (sessionAnswers.filter(a => a).length / sessionAnswers.length) * 100
                : 0
        });

        const currentLearningPlan = JSON.stringify({
            sessions: project.sessions.map(s => ({
                session: s.session,
                type: s.type,
                questions: s.questions,
                status: s.status,
                atomCount: s.atoms.length,
                phase: s.phase || 'calibration',
                questionFormats: s.questionFormats,
            })),
            learningPath: project.learningPath
        });

        const adjustment = await this.strategicTutor.adjustPath({
            fsrsData,
            performanceHistory,
            currentLearningPlan,
            tutorLog: ''
        });

        if (adjustment.adjustments.add && adjustment.adjustments.add.length > 0) {
            console.log(`[StudySessionUseCase] AI recommended ${adjustment.adjustments.add.length} additional sessions.`);

            const newSessionsToAdd = adjustment.adjustments.add.map((newSession: any) => ({
                type: newSession.type,
                questions: newSession.questions,
                duration: newSession.duration,
                phase: newSession.phase,
                questionFormats: newSession.questionFormats,
            }));

            // Call UI callback to apply new sessions locally
            addSessionsCallback(newSessionsToAdd, sessionIndex);
        }
    }
}
