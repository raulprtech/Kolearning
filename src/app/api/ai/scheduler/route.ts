import { NextRequest } from 'next/server';
import { listJobsFlow, addJobFlow, removeJobFlow, runJobNowFlow } from '@/ai/flows/scheduler-flows';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const result = await listJobsFlow();
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('[API Scheduler GET Error]:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        let result;
        switch (action) {
            case 'add':
                result = await addJobFlow(data);
                break;
            case 'remove':
                result = await removeJobFlow({ id: data.id });
                break;
            case 'run':
                result = await runJobNowFlow({ id: data.id });
                break;
            default:
                return new Response(JSON.stringify({ error: 'Invalid action' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('[API Scheduler POST Error]:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
