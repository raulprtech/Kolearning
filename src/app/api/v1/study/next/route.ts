import { NextResponse } from 'next/server';
import { ProjectDatabase } from '@/lib/supabase/database';
import { calculateCurrentRetrievability } from '@/core/domain/mastery';
import { differenceInDays } from 'date-fns';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const limitStr = searchParams.get('limit');
        const limit = limitStr ? parseInt(limitStr, 10) : 5;

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId parameter' }, { status: 400 });
        }

        const db = new ProjectDatabase();
        // Since we don't have auth token for headless agent yet, we bypass RLS or use service key.
        // Assumes ProjectDatabase uses an admin client or bypasses RLS for this specific route 
        // OR the agent passes a valid Authorization Bearer token that we pass to Supabase.
        const projectData = await db.getProjectById(projectId);

        if (!projectData) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const atoms = projectData.atoms;

        // Simple scheduling: sort by retrievability (lowest first) or new atoms
        const scheduledAtoms = atoms.sort((a, b) => {
            const getRetrievability = (atom: any) => {
                if (!atom.lastReviewed || !atom.stability) return 0; // New items
                const daysSince = differenceInDays(new Date(), new Date(atom.lastReviewed));
                return calculateCurrentRetrievability(atom.stability, daysSince);
            };
            return getRetrievability(a) - getRetrievability(b);
        }).slice(0, limit);

        // Sanitize the response for the agent
        const agentPayload = scheduledAtoms.map(atom => ({
            id: atom.id,
            type: atom.type,
            question: atom.question,
            // For multiple choice, we could pass distractors
            options: atom.incorrectAnswers && atom.incorrectAnswers.length > 0
                ? [atom.answer, ...atom.incorrectAnswers].sort(() => Math.random() - 0.5)
                : undefined,
            // If it's a game, we might pass the payload directly
            payload: atom.payload
        }));

        return NextResponse.json({
            projectTitle: projectData.title,
            atoms: agentPayload,
            totalPending: atoms.length
        });

    } catch (error) {
        console.error('API Error in /study/next:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
