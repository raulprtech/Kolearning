import { ai } from '../genkit';
import { z } from 'genkit';
import { scheduler, CronJobConfig } from '../scheduler';

export const scheduleTaskTool = ai.defineTool(
    {
        name: 'scheduleTask',
        description: 'Schedules a background task/flow to be executed later.',
        inputSchema: z.object({
            id: z.string().describe("Unique ID for this task"),
            schedule: z.string().describe("Cron expression (e.g., '0 8 * * *' for daily at 8AM) or relative time if supported."),
            flowName: z.string().describe("Name of the flow to execute (e.g., 'kolearningOrchestrator')"),
            payload: z.any().describe("Input payload for the flow"),
            description: z.string().optional().describe("What this task does")
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string()
        }),
    },
    async (config) => {
        console.log(`[SchedulerTool] AI is scheduling task: ${config.id}`);
        try {
            scheduler.addJob(config as CronJobConfig);
            return {
                success: true,
                message: `Task "${config.id}" scheduled successfully for ${config.schedule}.`
            };
        } catch (error) {
            console.error("[SchedulerTool] Error scheduling task:", error);
            return {
                success: false,
                message: `Failed to schedule task: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
);
