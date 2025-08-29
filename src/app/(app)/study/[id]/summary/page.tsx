
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
import { Loader2, Star, Target, BrainCircuit, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ProjectCompletionDialog } from '@/components/ui/project-completion-dialog';


function SessionSummaryContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { projects, completeSession, masteryPoints, sessionAnswers, cognitiveCredits, learnerRankInfo } = useProjects();
    const projectId = params.id as string;
    const sessionIndex = parseInt(searchParams.get('sessionIndex') || '0', 10);
    
    const [isLoading, setIsLoading] = useState(true);
    const [hasCompleted, setHasCompleted] = useState(false);
    const [isProjectCompleted, setIsProjectCompleted] = useState(false);
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);

    const project = projects.find(p => p.id === projectId);

    useEffect(() => {
        if (hasCompleted || !project) return;
        
        const isLastSession = sessionIndex === project.sessions.length - 1;
        setIsProjectCompleted(isLastSession);

        completeSession(projectId, sessionIndex);
        setHasCompleted(true);
        setIsLoading(false);
        
        if (isLastSession) {
            setShowCompletionDialog(true);
        }

    }, [projectId, sessionIndex, completeSession, hasCompleted, project]);


    const handleFinish = () => {
        router.push(`/projects/${projectId}?sessionCompleted=true`);
    };

    const correctAnswers = sessionAnswers.filter(answer => answer === true).length;
    const totalAnswers = sessionAnswers.length;
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    
    if (!project || !learnerRankInfo) {
      return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>;
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center">
                            <div className="bg-card/50 p-4 rounded-lg">
                                <Star className="mx-auto h-8 w-8 text-yellow-400 mb-2" />
                                <p className="text-2xl font-bold">{masteryPoints}</p>
                                <p className="text-sm text-muted-foreground">Puntos de Dominio</p>
                            </div>
                            <div className="bg-card/50 p-4 rounded-lg">
                                <Target className="mx-auto h-8 w-8 text-green-400 mb-2" />
                                <p className="text-2xl font-bold">{accuracy}%</p>
                                <p className="text-sm text-muted-foreground">Precisión</p>
                            </div>
                             <div className="bg-card/50 p-4 rounded-lg">
                                <BrainCircuit className="mx-auto h-8 w-8 text-blue-400 mb-2" />
                                <p className="text-2xl font-bold">{cognitiveCredits}</p>
                                <p className="text-sm text-muted-foreground">Créditos Cognitivos</p>
                            </div>
                        </div>

                         <div className="bg-card/50 p-4 rounded-lg text-center mb-8">
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
        </>
    );
}


export default function SessionSummaryPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <SessionSummaryContent />
        </Suspense>
    );
}
