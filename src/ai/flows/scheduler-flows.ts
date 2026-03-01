import { ai } from '../genkit';
import { scheduler, CronJobConfig } from '../scheduler';
import { z } from 'zod';

export const listJobsFlow = ai.defineFlow(
    {
        name: 'listJobsFlow',
        inputSchema: z.void(),
        outputSchema: z.array(z.any()),
    },
    async () => {
        return scheduler.listJobs();
    }
);

export const addJobFlow = ai.defineFlow(
    {
        name: 'addJobFlow',
        inputSchema: z.object({
            id: z.string(),
            schedule: z.string(),
            flowName: z.string(),
            payload: z.any().optional(),
            description: z.string().optional(),
        }),
    },
    async (input) => {
        scheduler.addJob(input as CronJobConfig);
        return { success: true, message: `Job ${input.id} added.` };
    }
);

export const removeJobFlow = ai.defineFlow(
    {
        name: 'removeJobFlow',
        inputSchema: z.object({
            id: z.string(),
        }),
    },
    async (input) => {
        scheduler.removeJob(input.id);
        return { success: true, message: `Job ${input.id} removed.` };
    }
);

export const runJobNowFlow = ai.defineFlow(
    {
        name: 'runJobNowFlow',
        inputSchema: z.object({
            id: z.string(),
        }),
    },
    async (input) => {
        const result = await scheduler.runJobNow(input.id);
        return { success: true, result };
    }
);
