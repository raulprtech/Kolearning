import { Project, Session, LearningPathItem } from '../../domain/models/project';
import { Paper } from '../../domain/models/paper';
import { Atom } from '../../domain/models/atom';

export interface IProjectRepository {
    // Project operations
    getProjects(userId: string): Promise<Project[]>;
    getCompletedProjects(userId: string): Promise<Project[]>;
    getArchivedProjects(userId: string): Promise<Project[]>;
    createProject(userId: string, project: Project, logCallback?: (msg: string) => void): Promise<string>;
    updateProject(projectId: string, updates: Partial<Project>): Promise<void>;
    updateLearningPathAndSessions(projectId: string, learningPath: LearningPathItem[], sessions: Session[]): Promise<void>;
    completeProject(projectId: string): Promise<void>;
    deleteProject(projectId: string): Promise<void>;
    archiveProject(projectId: string): Promise<boolean>;
    unarchiveProject(projectId: string): Promise<void>;
    deleteProjectPermanently(projectId: string): Promise<void>;

    // Atom & Sessions operations
    updateAtom(projectId: string, atom: Atom): Promise<void>;
    addAtoms(projectId: string, atoms: Atom[]): Promise<void>;
    updateAtoms(projectId: string, atoms: Atom[]): Promise<void>;
    addSessions(projectId: string, sessions: Session[]): Promise<void>;

    // Sources
    getSourceContent(sourceId: string): Promise<string>;
    updateSourceStatus(sourceId: string, status: string): Promise<void>;
    addSource(projectId: string, source: Omit<Source, 'id'>): Promise<string>;

    // Paper Box operations
    getPapers(userId: string): Promise<Paper[]>;
    createPaper(userId: string, paper: Omit<Paper, 'id' | 'createdAt' | 'lastInteraction'>): Promise<string>;
    updatePaper(paperId: string, updates: Partial<Paper>): Promise<void>;
    deletePaper(paperId: string): Promise<void>;
}
