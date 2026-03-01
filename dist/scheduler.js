import { Cron } from 'croner';
import fs from 'fs';
import path from 'path';
import * as allFlows from './flows';
const JOBS_FILE = path.join(process.cwd(), 'cron-jobs.json');
export class Scheduler {
    constructor() {
        this.jobs = new Map();
        this.loadJobs();
    }
    loadJobs() {
        try {
            if (fs.existsSync(JOBS_FILE)) {
                const data = fs.readFileSync(JOBS_FILE, 'utf-8');
                const configs = JSON.parse(data);
                configs.forEach(config => this.scheduleJob(config));
                console.log(`[Scheduler] Loaded ${configs.length} jobs from ${JOBS_FILE}`);
            }
        }
        catch (error) {
            console.error('[Scheduler] Error loading jobs:', error);
        }
    }
    saveJobs() {
        try {
            const configs = Array.from(this.jobs.values()).map(j => j.config);
            fs.writeFileSync(JOBS_FILE, JSON.stringify(configs, null, 2));
        }
        catch (error) {
            console.error('[Scheduler] Error saving jobs:', error);
        }
    }
    scheduleJob(config) {
        if (this.jobs.has(config.id)) {
            this.stopJob(config.id);
        }
        if (config.enabled === false) {
            this.jobs.set(config.id, { config, cron: null });
            return;
        }
        const cron = new Cron(config.schedule, async () => {
            console.log(`[Scheduler] Executing job: ${config.id} (${config.flowName})`);
            try {
                const flow = allFlows[config.flowName];
                if (!flow) {
                    console.error(`[Scheduler] Flow not found: ${config.flowName}`);
                    return;
                }
                await flow(config.payload);
                console.log(`[Scheduler] Job ${config.id} completed successfully.`);
            }
            catch (error) {
                console.error(`[Scheduler] Error executing job ${config.id}:`, error);
            }
        });
        this.jobs.set(config.id, { config, cron });
        console.log(`[Scheduler] Scheduled job: ${config.id} with schedule: ${config.schedule}`);
    }
    stopJob(id) {
        const job = this.jobs.get(id);
        if (job && job.cron) {
            job.cron.stop();
            console.log(`[Scheduler] Stopped job: ${id}`);
        }
    }
    addJob(config) {
        var _a;
        this.scheduleJob(Object.assign(Object.assign({}, config), { enabled: (_a = config.enabled) !== null && _a !== void 0 ? _a : true }));
        this.saveJobs();
    }
    removeJob(id) {
        this.stopJob(id);
        this.jobs.delete(id);
        this.saveJobs();
    }
    listJobs() {
        return Array.from(this.jobs.values()).map(j => j.config);
    }
    async runJobNow(id) {
        const job = this.jobs.get(id);
        if (!job)
            throw new Error(`Job ${id} not found`);
        console.log(`[Scheduler] Manually triggering job: ${id}`);
        const flow = allFlows[job.config.flowName];
        if (!flow)
            throw new Error(`Flow ${job.config.flowName} not found`);
        return await flow(job.config.payload);
    }
}
// Singleton instance
export const scheduler = new Scheduler();
