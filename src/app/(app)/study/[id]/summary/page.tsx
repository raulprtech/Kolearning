
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
    const { completeSession, masteryPoints, totalMasteryPoints } = useProjects();
    const projectId = params.id as string;
    const sessionIndex = parseInt(searchParams.get('sessionIndex') || '0', 10);
    
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mark session as complete when component mounts
        completeSession(projectId, sessionIndex);
        setIsLoading(false);
    }, [projectId, sessionIndex, completeSession]);


    const handleFinish = () => {
        router.push(`/projects/${projectId}?sessionCompleted=true`);
    };

    const learnerRankInfo = getLearnerRank(totalMasteryPoints);

    return (
        <div className="flex flex-col flex-1 items-center justify-center p-4 md:p-8 bg-background">
            <div className="w-full max-w-2xl">
                <Card className="bg-card/50 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl text-center">Resumen de la Sesión</CardTitle>
                        <CardDescription className="text-center">¡Gran trabajo! Revisa tu progreso.</CardDescription>
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
                                <p className="text-sm text-muted-foreground">Rango de Aprendedor</p>
                                <Progress value={learnerRankInfo.progress} className="h-2 mt-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {learnerRankInfo.nextRankName !== "S" || learnerRankInfo.pointsToNext > 0
                                        ? `${learnerRankInfo.pointsToNext} pts para Rango ${learnerRankInfo.nextRankName}`
                                        : "¡Rango Máximo!"
                                    }
                                </p>
                            </div>
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
