import { IProjectRepository } from '../../core/ports/outbound/IProjectRepository';
import { Project, Session, LearningPathItem, Source } from '../../core/domain/models/project';
import { Paper } from '../../core/domain/models/paper';
import { Atom } from '../../core/domain/models/atom';
import { ProjectDatabase } from '../../lib/supabase/database';

export class SupabaseProjectRepository implements IProjectRepository {
    private db: ProjectDatabase;

    constructor() {
        this.db = new ProjectDatabase();
    }

    async getProjects(userId: string): Promise<Project[]> {
        return this.db.getProjects(userId);
    }

    async getCompletedProjects(userId: string): Promise<Project[]> {
        return this.db.getCompletedProjects(userId);
    }

    async getArchivedProjects(userId: string): Promise<Project[]> {
        return this.db.getArchivedProjects(userId);
    }

    async createProject(userId: string, project: Project, logCallback?: (msg: string) => void): Promise<string> {
        return this.db.createProject(userId, project, logCallback);
    }

    async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
        return this.db.updateProject(projectId, updates);
    }

    async updateLearningPathAndSessions(projectId: string, learningPath: LearningPathItem[], sessions: Session[]): Promise<void> {
        return this.db.updateLearningPathAndSessions(projectId, learningPath, sessions);
    }

    async completeProject(projectId: string): Promise<void> {
        return this.db.completeProject(projectId);
    }

    async deleteProject(projectId: string): Promise<void> {
        return this.db.deleteProject(projectId);
    }

    // Atom & Sessions operations
    async updateAtom(projectId: string, atom: Atom): Promise<void> {
        return this.db.updateAtom(projectId, atom);
    }

    async addAtoms(projectId: string, atoms: Atom[]): Promise<void> {
        return this.db.addAtoms(projectId, atoms);
    }

    async updateAtoms(projectId: string, atoms: Atom[]): Promise<void> {
        return this.db.updateAtoms(projectId, atoms);
    }

    async addSessions(projectId: string, sessions: Session[]): Promise<void> {
        return this.db.addSessions(projectId, sessions);
    }

    // Sources
    async getSourceContent(sourceId: string): Promise<string> {
        return this.db.getSourceContent(sourceId);
    }

    async updateSourceStatus(sourceId: string, status: string): Promise<void> {
        return this.db.updateSourceStatus(sourceId, status);
    }

    async addSource(projectId: string, source: Omit<Source, 'id'>): Promise<string> {
        return this.db.addSource(projectId, source);
    }

    async archiveProject(projectId: string): Promise<boolean> {
        await this.db.archiveProject(projectId);
        return true;
    }

    async unarchiveProject(projectId: string): Promise<void> {
        return this.db.unarchiveProject(projectId);
    }

    async deleteProjectPermanently(projectId: string): Promise<void> {
        return this.db.deleteProject(projectId);
    }

    // Paper Box
    async getPapers(userId: string): Promise<Paper[]> {
        return this.db.getPapers(userId);
    }

    async createPaper(userId: string, paper: Omit<Paper, 'id' | 'createdAt' | 'lastInteraction'>): Promise<string> {
        return this.db.createPaper(userId, paper);
    }

    async updatePaper(paperId: string, updates: Partial<Paper>): Promise<void> {
        return this.db.updatePaper(paperId, updates);
    }

    async deletePaper(paperId: string): Promise<void> {
        return this.db.deletePaper(paperId);
    }
}
