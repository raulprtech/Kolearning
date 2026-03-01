import { ai } from '../genkit';
import { z } from 'genkit';
import { GoogleTasksService } from '@/infrastructure/services/GoogleTasksService';

export const listGoogleTasksTool = ai.defineTool(
    {
        name: 'listGoogleTasks',
        description: 'Lists tasks from the user\'s Google Tasks. Requires a Google Access Token.',
        inputSchema: z.object({
            accessToken: z.string().describe("The user's Google OAuth access token"),
            tasklistId: z.string().optional().describe("The ID of the task list to list tasks from")
        }),
        outputSchema: z.array(z.object({
            id: z.string(),
            title: z.string(),
            status: z.string(),
            notes: z.string().optional()
        })),
    },
    async ({ accessToken, tasklistId }) => {
        const service = new GoogleTasksService(accessToken);
        const tasks = await service.getTasks(tasklistId);
        return tasks.map(t => ({
            id: t.id!,
            title: t.title!,
            status: t.status!,
            notes: t.notes || undefined
        }));
    }
);

export const createGoogleTaskTool = ai.defineTool(
    {
        name: 'createGoogleTask',
        description: 'Creates a new task in the user\'s Google Tasks. Requires a Google Access Token.',
        inputSchema: z.object({
            accessToken: z.string().describe("The user's Google OAuth access token"),
            title: z.string().describe("The title of the task"),
            notes: z.string().optional().describe("Optional notes for the task"),
            due: z.string().optional().describe("Optional due date (ISO 8601)"),
            tasklistId: z.string().optional().default('@default').describe("The ID of the task list to create the task in")
        }),
        outputSchema: z.object({
            id: z.string(),
            title: z.string(),
            success: z.boolean()
        }),
    },
    async ({ accessToken, title, notes, due, tasklistId }) => {
        const service = new GoogleTasksService(accessToken);
        const result = await service.createTask({ title, notes, due }, tasklistId);
        return {
            id: result.id!,
            title: result.title!,
            success: true
        };
    }
);
