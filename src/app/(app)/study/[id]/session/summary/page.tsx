
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useProjects } from '@/contexts/ProjectContext';
import { Loader2, Target, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ProjectCompletionDialog } from '@/components/ui/project-completion-dialog';


function SessionSummaryContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { projects, completeSession, sessionAnswers, learnerRankInfo } = useProjects();
    const projectId = params.id as string;
    const sessionIndex = parseInt(searchParams.get('sessionIndex') || '0', 10);

    const [isLoading, setIsLoading] = useState(false);
    const [isProjectCompleted, setIsProjectCompleted] = useState(false);
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);

    // Capture session stats to prevent flickering when context is cleared
    const [stats, setStats] = useState({
        correctAnswers: 0,
        totalAnswers: 0,
        accuracy: 0
    });

    const project = projects.find(p => p.id === projectId);

    useEffect(() => {
        if (!project) return;

        // Initialize stats if not already set
        if (stats.totalAnswers === 0 && sessionAnswers.length > 0) {
            const correct = sessionAnswers.filter(a => a === true).length;
            const total = sessionAnswers.length;
            setStats({
                correctAnswers: correct,
                totalAnswers: total,
                accuracy: total > 0 ? Math.round((correct / total) * 100) : 0
            });
        }

        const isLastSession = sessionIndex === project.sessions.length - 1;

        // Check if all sessions are completed
        const allSessionsDone = project.sessions.every(s => s.status === 'Completed');

        if (isLastSession || allSessionsDone) {
            setIsProjectCompleted(true);
            // Open the dialog automatically if the project is finished
            setShowCompletionDialog(true);
        }
    }, [project, sessionIndex, sessionAnswers, stats.totalAnswers]);


    const handleFinish = async () => {
        setIsLoading(true);
        try {
            await completeSession(projectId, sessionIndex);
            router.push(`/study/${projectId}?sessionCompleted=true`);
        } catch (error) {
            console.error("Error completing session:", error);
            setIsLoading(false);
            // Still navigate even if AI adjustment fails
            router.push(`/study/${projectId}?sessionCompleted=true`);
        }
    };

    const { accuracy } = stats;

    if (!project || !learnerRankInfo) {
        return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <>
            <ProjectCompletionDialog
                isOpen={showCompletionDialog}
                onClose={() => setShowCompletionDialog(false)}
                project={project}
                onFinish={handleFinish}
            />
            <div className="flex flex-col flex-1 items-center justify-center p-4 md:p-8 bg-background">
                <div className="w-full max-w-2xl">
                    <Card className="bg-card/50 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl text-center">Resumen de la Sesión</CardTitle>
                            <CardDescription className="text-center">¡Gran trabajo! Revisa tu progreso.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center mb-8 text-center text-center">
                                <div className="bg-card/50 p-6 rounded-2xl border min-w-[200px]">
                                    <Target className="mx-auto h-12 w-12 text-green-400 mb-4" />
                                    <p className="text-4xl font-bold">{accuracy}%</p>
                                    <p className="text-sm text-muted-foreground mt-2">Precisión</p>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <Button size="lg" onClick={handleFinish} disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            Finalizar
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}


export default function SessionSummaryPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SessionSummaryContent />
        </Suspense>
    );
}
