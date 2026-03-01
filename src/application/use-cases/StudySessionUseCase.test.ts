import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudySessionUseCase } from './StudySessionUseCase';
import { Project } from '../../core/domain/models/project';
import { IProjectRepository } from '../../core/ports/outbound/IProjectRepository';

describe('StudySessionUseCase', () => {
    let projectRepository: IProjectRepository;
    let strategicTutor: any;
    let studySessionUseCase: StudySessionUseCase;

    beforeEach(() => {
        projectRepository = {
            updateProject: vi.fn().mockResolvedValue(true),
            updateLearningPathAndSessions: vi.fn().mockResolvedValue(true),
            updateAtoms: vi.fn().mockResolvedValue(true),
            completeProject: vi.fn().mockResolvedValue(true),
        } as unknown as IProjectRepository;

        strategicTutor = {
            adjustPath: vi.fn().mockResolvedValue({ adjustments: { add: [] } }),
        };

        studySessionUseCase = new StudySessionUseCase(projectRepository, strategicTutor);
    });

    it('should complete a session and update project stats', async () => {
        const project: Project = {
            id: 'p1',
            title: 'P1',
            description: '',
            icon: '',
            categories: [],
            sources: [],
            atoms: [],
            sessions: [
                { session: 1, type: 'Initial', status: 'Continue', atoms: [], questions: '', duration: '', phase: 'calibration', questionFormats: '' },
                { session: 2, type: 'Next', status: 'Locked', atoms: [], questions: '', duration: '', phase: 'calibration', questionFormats: '' },
            ],
            learningPath: [],
            mastery: 0,
            totalAnswers: 0,
            correctAnswers: 0,
        };

        const { updatedProject } = await studySessionUseCase.execute(
            'u1',
            project,
            0,
            [true, false],
            1,
            vi.fn()
        );

        expect(updatedProject.sessions[0].status).toBe('Completed');
        expect(updatedProject.sessions[1].status).toBe('Continue');
        expect(updatedProject.totalAnswers).toBe(2);
        expect(updatedProject.correctAnswers).toBe(1);
        expect(projectRepository.updateProject).toHaveBeenCalled();
    });

    it('should mark project as fully completed if all sessions are done', async () => {
        const project: Project = {
            id: 'p1',
            title: 'P1',
            description: '',
            icon: '',
            categories: [],
            sources: [],
            atoms: [],
            sessions: [
                { session: 1, type: 'Initial', status: 'Continue', atoms: [], questions: '', duration: '', phase: 'calibration', questionFormats: '' },
            ],
            learningPath: [],
            mastery: 0,
        };

        const { isFullyCompleted } = await studySessionUseCase.execute(
            'u1',
            project,
            0,
            [true],
            1,
            vi.fn()
        );

        expect(isFullyCompleted).toBe(true);
        expect(projectRepository.completeProject).toHaveBeenCalledWith('p1');
    });
});
