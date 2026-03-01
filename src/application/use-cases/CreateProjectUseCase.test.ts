import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateProjectUseCase } from './CreateProjectUseCase';
import { Project } from '../../core/domain/models/project';
import { IProjectRepository } from '../../core/ports/outbound/IProjectRepository';

describe('CreateProjectUseCase', () => {
    let projectRepository: IProjectRepository;
    let createProjectUseCase: CreateProjectUseCase;

    beforeEach(() => {
        projectRepository = {
            createProject: vi.fn().mockResolvedValue('project-id-123'),
            getProjectById: vi.fn(),
            getUserProjects: vi.fn(),
            updateProject: vi.fn(),
            deleteProject: vi.fn(),
            completeProject: vi.fn(),
            updateLearningPathAndSessions: vi.fn(),
            updateAtoms: vi.fn(),
        } as unknown as IProjectRepository;
        createProjectUseCase = new CreateProjectUseCase(projectRepository);
    });

    it('should create a calibration session if no sessions exist', async () => {
        const project: Project = {
            id: 'p-1',
            title: 'Test Project',
            description: 'Test Description',
            atoms: [{ question: 'Q1', answer: 'A1' }, { question: 'Q2', answer: 'A2' }],
            sessions: [],
            learningPath: [],
            mastery: 0,
            totalAnswers: 0,
            correctAnswers: 0,
            bestStreak: 0,
            icon: '',
            categories: [],
            sources: [],
        };

        const result = await createProjectUseCase.execute(null, project);

        expect(result.sessions).toHaveLength(1);
        expect(result.sessions[0].type).toBe('Initial Calibration');
        expect(result.sessions[0].atoms).toHaveLength(2);
    });

    it('should persist project to repository if userId is provided', async () => {
        const project: Project = {
            id: 'p-2',
            title: 'Test Project',
            atoms: [],
            sessions: [],
            learningPath: [],
            mastery: 0,
            icon: '',
            categories: [],
            sources: [],
            description: '',
        };

        const result = await createProjectUseCase.execute('user-123', project);

        expect(projectRepository.createProject).toHaveBeenCalledWith('user-123', expect.any(Object), undefined);
        expect(result.id).toBe('project-id-123');
    });
});
