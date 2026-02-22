import { NextResponse } from 'next/server';
import { ProjectDatabase } from '@/lib/supabase/database';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, atomId, isCorrect, fsrsRating, responseTimeMs } = body;

        if (!projectId || !atomId || typeof isCorrect !== 'boolean' || !fsrsRating) {
            return NextResponse.json({ error: 'Missing required parameters: projectId, atomId, isCorrect, fsrsRating' }, { status: 400 });
        }

        const db = new ProjectDatabase();
        const projectData = await db.getProjectById(projectId);

        if (!projectData) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const atomIndex = projectData.atoms.findIndex((a: any) => a.id === atomId);
        if (atomIndex === -1) {
            return NextResponse.json({ error: 'Atom not found' }, { status: 404 });
        }

        const atom = projectData.atoms[atomIndex];

        // 1. Basic FSRS update logic (Simplified for headless MVP)
        // In a real scenario, we'd use the full FSRS algorithm here based on the `fsrsRating` (1=Again, 2=Hard, 3=Good, 4=Easy)
        const previousStability = atom.stability || 0;

        // Simplified mock adjustment
        let newStability = previousStability;
        if (isCorrect) {
            newStability = previousStability === 0 ? 1 : previousStability * (1.5 + (fsrsRating * 0.1));
        } else {
            newStability = Math.max(0.1, previousStability * 0.5);
        }

        const updatedAtom = {
            ...atom,
            stability: newStability,
            lastReviewed: new Date().toISOString(),
            // Only increment if incorrect, or could keep a history
            incorrectAnswers: isCorrect ? atom.incorrectAnswers : (atom.incorrectAnswers || [])
        };

        // 2. Persist to DB
        await db.updateAtom(projectId, updatedAtom);

        return NextResponse.json({
            success: true,
            message: 'Atom updated successfully',
            newStability: updatedAtom.stability,
            isCorrect
        });

    } catch (error) {
        console.error('API Error in /study/answer:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
