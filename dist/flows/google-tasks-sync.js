import { ai } from '../genkit';
import { z } from 'genkit';
import { listGoogleTasksTool } from '../tools/google-tasks';
export const googleTasksSyncFlow = ai.defineFlow({
    name: 'googleTasksSyncFlow',
    inputSchema: z.object({
        accessToken: z.string().describe("Google OAuth access token"),
        userId: z.string().optional()
    }),
    outputSchema: z.object({
        summary: z.string(),
        taskCount: z.number()
    }),
}, async (input) => {
    // 1. List tasks
    const tasks = await ai.run('list-tasks', async () => {
        // We pass the accessToken to the tool call
        const result = await listGoogleTasksTool({ accessToken: input.accessToken, tasklistId: '@default' });
        return result;
    });
    if (tasks.length === 0) {
        return {
            summary: "No tienes tareas pendientes en Google Tasks.",
            taskCount: 0
        };
    }
    // 2. Generate summary
    const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        system: 'Eres un asistente productivo. Resume la lista de tareas del usuario de forma motivadora y concisa.',
        prompt: `Tengo las siguientes tareas: ${tasks.map(t => t.title).join(', ')}. Dame un resumen corto.`,
    });
    return {
        summary: response.text,
        taskCount: tasks.length
    };
});
