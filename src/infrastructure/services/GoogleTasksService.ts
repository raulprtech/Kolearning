import { google, tasks_v1 } from 'googleapis';

export interface GoogleTask {
    id?: string;
    title: string;
    notes?: string;
    due?: string;
    status?: 'needsAction' | 'completed';
}

export class GoogleTasksService {
    private tasks: tasks_v1.Tasks;

    constructor(accessToken: string) {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        this.tasks = google.tasks({ version: 'v1', auth });
    }

    async getTaskLists() {
        try {
            const response = await this.tasks.tasklists.list();
            return response.data.items || [];
        } catch (error) {
            console.error('[GoogleTasksService] Error listing task lists:', error);
            throw error;
        }
    }

    async getTasks(tasklistId: string = '@default') {
        try {
            const response = await this.tasks.tasks.list({ tasklist: tasklistId });
            return response.data.items || [];
        } catch (error) {
            console.error('[GoogleTasksService] Error listing tasks:', error);
            throw error;
        }
    }

    async createTask(task: GoogleTask, tasklistId: string = '@default') {
        try {
            const response = await this.tasks.tasks.insert({
                tasklist: tasklistId,
                requestBody: task as tasks_v1.Schema$Task,
            });
            return response.data;
        } catch (error) {
            console.error('[GoogleTasksService] Error creating task:', error);
            throw error;
        }
    }

    async updateTask(tasklistId: string, taskId: string, updates: Partial<GoogleTask>) {
        try {
            const response = await this.tasks.tasks.patch({
                tasklist: tasklistId,
                task: taskId,
                requestBody: updates as tasks_v1.Schema$Task,
            });
            return response.data;
        } catch (error) {
            console.error('[GoogleTasksService] Error updating task:', error);
            throw error;
        }
    }
}
