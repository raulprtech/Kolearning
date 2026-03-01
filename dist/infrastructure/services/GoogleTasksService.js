import { google } from 'googleapis';
export class GoogleTasksService {
    constructor(accessToken) {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        this.tasks = google.tasks({ version: 'v1', auth });
    }
    async getTaskLists() {
        try {
            const response = await this.tasks.tasklists.list();
            return response.data.items || [];
        }
        catch (error) {
            console.error('[GoogleTasksService] Error listing task lists:', error);
            throw error;
        }
    }
    async getTasks(tasklistId = '@default') {
        try {
            const response = await this.tasks.tasks.list({ tasklist: tasklistId });
            return response.data.items || [];
        }
        catch (error) {
            console.error('[GoogleTasksService] Error listing tasks:', error);
            throw error;
        }
    }
    async createTask(task, tasklistId = '@default') {
        try {
            const response = await this.tasks.tasks.insert({
                tasklist: tasklistId,
                requestBody: task,
            });
            return response.data;
        }
        catch (error) {
            console.error('[GoogleTasksService] Error creating task:', error);
            throw error;
        }
    }
    async updateTask(tasklistId, taskId, updates) {
        try {
            const response = await this.tasks.tasks.patch({
                tasklist: tasklistId,
                task: taskId,
                requestBody: updates,
            });
            return response.data;
        }
        catch (error) {
            console.error('[GoogleTasksService] Error updating task:', error);
            throw error;
        }
    }
}
