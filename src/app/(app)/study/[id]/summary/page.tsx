
"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KoliAvatar } from '@/components/icons/koli-avatar';
import { useProjects } from '@/contexts/ProjectContext';
import { dynamicLearningPathAdjustment, DynamicLearningPathAdjustmentOutput } from '@/ai/flows/koli-strategic-tutor';
import { Loader2, Star, Target, BrainCircuit, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const ranks = [
    { name: "G", minPoints: 0 },
    { name: "F", minPoints: 100 },
    { name: "E", minPoints: 250 },
    { name: "D", minPoints: 500 },
    { name: "C", minPoints: 1000 },
    { name: "B", minPoints: 2000 },
    { name: "A", minPoints: 5000 },
    { name: "S", minPoints: 10000 },
];

const getLearnerRank = (totalMasteryPoints: number) => {
    let currentRank = ranks[0];
    let nextRank = ranks[1];

    for (let i = 0; i < ranks.length; i++) {
        if (totalMasteryPoints >= ranks[i].minPoints) {
            currentRank = ranks[i];
            if (i < ranks.length - 1) {
                nextRank = ranks[i + 1];
            } else {
                nextRank = { name: "S", minPoints: Infinity }; // Max rank
            }
        }
    }

    const pointsInCurrentRank = totalMasteryPoints - currentRank.minPoints;
    const pointsForNextRank = nextRank.minPoints - currentRank.minPoints;
    const progressPercentage = pointsForNextRank === Infinity ? 100 : Math.round((pointsInCurrentRank / pointsForNextRank) * 100);
    const pointsToNext = pointsForNextRank === Infinity ? 0 : pointsForNextRank - pointsInCurrentRank;
    
    return {
        rankName: currentRank.name,
        nextRankName: nextRank.name,
        progress: progressPercentage,
        pointsToNext: pointsToNext,
    };
}


function SessionSummaryContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { projects, addSessionsToProject, completeSession, masteryPoints, totalMasteryPoints } = useProjects();
    const projectId = params.id as string;
    const sessionIndex = parseInt(searchParams.get('sessionIndex') || '0', 10);
    const fsrsRating = searchParams.get('fsrs');
    
    const [tutorResponse, setTutorResponse] = useState<DynamicLearningPathAdjustmentOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getTutorFeedback = useCallback(async () => {
        const project = projects.find(p => p.id === projectId);
        if (!project) {
            setError("Proyecto no encontrado.");
            setIsLoading(false);
            return;
        }

        completeSession(projectId, sessionIndex);

        try {
            const response = await dynamicLearningPathAdjustment({
                fsrsData: `User rated last card as FSRS value: ${fsrsRating}`,
                performanceHistory: 'User has been performing well, with 85% accuracy on last 10 cards.',
                currentLearningPlan: JSON.stringify(project.sessions),
            });
            setTutorResponse(response);
            if (response.newSessions && response.newSessions.length > 0) {
                addSessionsToProject(projectId, response.newSessions);
            }
        } catch (err) {
            console.error("Error getting tutor feedback:", err);
            setError("Koli no pudo generar el feedback en este momento.");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, sessionIndex, fsrsRating, completeSession, addSessionsToProject]);

    useEffect(() => {
        getTutorFeedback();
    }, [getTutorFeedback]);

    const handleFinish = () => {
        const planUpdated = tutorResponse && tutorResponse.newSessions.length > 0;
        const query = planUpdated ? '?planUpdated=true' : '?sessionCompleted=true';
        router.push(`/projects/${projectId}${query}`);
    };

    const learnerRankInfo = getLearnerRank(totalMasteryPoints);

    return (
        <div className="flex flex-col flex-1 items-center justify-center p-4 md:p-8 bg-background">
            <div className="w-full max-w-2xl">
                <Card className="bg-card/50 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl text-center">Resumen de la Sesión</CardTitle>
                        <CardDescription className="text-center">¡Gran trabajo! Revisa tu progreso y el feedback de Koli.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center">
                            <div className="bg-card/50 p-4 rounded-lg">
                                <Star className="mx-auto h-8 w-8 text-yellow-400 mb-2" />
                                <p className="text-2xl font-bold">{masteryPoints}</p>
                                <p className="text-sm text-muted-foreground">Puntos de Dominio Ganados</p>
                            </div>
                            <div className="bg-card/50 p-4 rounded-lg">
                                <Target className="mx-auto h-8 w-8 text-green-400 mb-2" />
                                <p className="text-2xl font-bold">92%</p>
                                <p className="text-sm text-muted-foreground">Precisión</p>
                            </div>
                             <div className="bg-card/50 p-4 rounded-lg text-center">
                                <p className="text-5xl font-bold font-headline">{learnerRankInfo.rankName}</p>
                                <p className="text-sm text-muted-foreground mb-2">Rango de Aprendedor</p>
                                <Progress value={learnerRankInfo.progress} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {learnerRankInfo.nextRankName !== "S" || learnerRankInfo.pointsToNext > 0
                                        ? `${learnerRankInfo.pointsToNext} pts para Rango ${learnerRankInfo.nextRankName}`
                                        : "¡Rango Máximo!"
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <KoliAvatar className="h-8 w-8" />
                                Feedback de Koli
                            </h3>
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            ) : error ? (
                                <p className="text-destructive-foreground">{error}</p>
                            ) : (
                                <p className="text-muted-foreground italic">"{tutorResponse?.feedback}"</p>
                            )}
                            
                            {tutorResponse && tutorResponse.newSessions.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <h4 className="font-semibold flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary"/>Plan Actualizado</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        He añadido {tutorResponse.newSessions.length} nueva(s) sesión(es) de refuerzo a tu plan.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-center">
                            <Button size="lg" onClick={handleFinish} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                ) : (
                                    <>
                                        Finalizar
                                        <ChevronRight className="ml-2 h-4 w-4"/>
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function SessionSummaryPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <SessionSummaryContent />
        </Suspense>
    );
}
