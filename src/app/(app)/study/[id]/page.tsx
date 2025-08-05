
"use client"

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Lightbulb, Repeat, BrainCircuit, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProjects } from "@/contexts/ProjectContext";
import { explainCorrectAnswer, ExplainCorrectAnswerOutput } from "@/ai/flows/koli-explain-answer";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudySessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { projects } = useProjects();
  
  const projectId = params.id as string;
  const sessionIndex = parseInt(searchParams.get('sessionIndex') || '0', 10);
  
  const project = projects.find(p => p.id === projectId);
  const session = project?.sessions[sessionIndex];

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionAtoms, setSessionAtoms] = useState(project?.atoms || []);
  const [viewState, setViewState] = useState<'question' | 'answer'>('question');
  const [userAnswer, setUserAnswer] = useState("");
  
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);
  const [explanation, setExplanation] = useState<ExplainCorrectAnswerOutput | null>(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);

  useEffect(() => {
    if (project) {
      // In a real scenario, you'd filter atoms based on the session type and FSRS data.
      // For now, we'll just use all atoms for any session.
      setSessionAtoms(project.atoms);
    }
  }, [project]);

  const currentAtom = useMemo(() => {
    if (!sessionAtoms || sessionAtoms.length === 0) {
      return { question: "No hay preguntas disponibles.", answer: "" };
    }
    return sessionAtoms[currentCardIndex];
  }, [sessionAtoms, currentCardIndex]);

  if (!project || !session) {
    return (
        <div className="flex flex-col flex-1 items-center justify-center">
            <h1 className="text-2xl">Sesión no encontrada</h1>
            <Button onClick={() => router.push('/')} className="mt-4">Volver al Dashboard</Button>
        </div>
    )
  }

  const handleRevealAnswer = () => {
    setViewState('answer');
  }

  const handleRate = (fsrs: number) => {
    if (currentCardIndex < sessionAtoms.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setViewState('question');
      setUserAnswer("");
    } else {
      // Last card, go to summary
      router.push(`/study/${projectId}/summary?sessionIndex=${sessionIndex}&fsrs=${fsrs}`);
    }
  };

  const handleExplainAnswer = async () => {
      setIsExplanationDialogOpen(true);
      setIsExplanationLoading(true);
      try {
          const result = await explainCorrectAnswer({
              question: currentAtom.question,
              correctAnswer: currentAtom.answer,
              learnerAnswer: userAnswer,
              context: `El usuario está en una sesión de tipo "${session.type}" para el proyecto "${project.title}".`
          });
          setExplanation(result);
      } catch (error) {
          console.error("Error explaining answer:", error);
          setExplanation({ explanation: "Lo siento, no pude generar una explicación en este momento." });
      } finally {
          setIsExplanationLoading(false);
      }
  }


  const ratings = [
      { label: "Muy Difícil", variant: "destructive", description: "Repetir Pronto", fsrs: 1 },
      { label: "Difícil", variant: "outline", description: "Revisar en un día", fsrs: 2 },
      { label: "Bien", variant: "secondary", description: "Revisar en unos días", fsrs: 3 },
      { label: "Fácil", variant: "default", description: "Revisar en una semana", fsrs: 4 },
  ] as const;

  const cardsRemaining = sessionAtoms.length - currentCardIndex;

  return (
    <div className="flex flex-col flex-1">
       <header className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{project.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="text-yellow-400" />
            <span className="font-bold text-lg text-foreground">⚡ {cardsRemaining}/{sessionAtoms.length}</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-3xl">
                <Card className="bg-card/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-4 right-4">
                    <Badge variant="secondary">{session.type}</Badge>
                </div>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-center">
                    {currentAtom.question}
                    </CardTitle>
                    <CardDescription className="text-center">
                    Formula tu respuesta a continuación. El recuerdo activo es clave para el dominio.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        rows={8}
                        placeholder="Tu respuesta..."
                        className="bg-background text-lg"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        readOnly={viewState === 'answer'}
                    />

                    {viewState === 'question' && (
                        <div className="mt-6 flex justify-center">
                            <Button size="lg" className="w-full max-w-xs" onClick={handleRevealAnswer}>
                                Revelar Respuesta
                            </Button>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center">
                    <h3 className="font-headline text-muted-foreground mb-4">
                        Soporte Táctico
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" size="icon" aria-label="Pista" disabled={viewState === 'question'}>
                            <Lightbulb />
                        </Button>
                        <Button variant="outline" size="icon" aria-label="Explicar Respuesta" onClick={handleExplainAnswer} disabled={viewState === 'question'}>
                            <BrainCircuit />
                        </Button>
                        <Button variant="outline" size="icon" aria-label="Reformular" disabled>
                            <Repeat />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Consultar a Koli" disabled>
                            <KoliAvatar className="h-6 w-6" />
                        </Button>
                    </div>
                    </div>
                    
                    {viewState === 'answer' && (
                        <div className="mt-8 pt-6 border-t">
                            <div className="bg-muted/50 p-4 rounded-lg mb-6">
                                <h4 className="font-bold font-headline mb-2 text-primary">
                                Respuesta Correcta
                                </h4>
                                <p>{currentAtom.answer}</p>
                            </div>

                            <h3 className="font-headline text-muted-foreground mb-4 text-center">
                                Califica tu rendimiento de recuerdo:
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {ratings.map(rating => (
                                    <Button key={rating.label} variant={rating.variant} className="h-auto py-3 flex-col w-full" onClick={() => handleRate(rating.fsrs)}>
                                        <span className="text-lg font-bold">{rating.label}</span>
                                        <span className="text-xs opacity-80">{rating.description}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
                </Card>
            </div>
            
            <Dialog open={isExplanationDialogOpen} onOpenChange={setIsExplanationDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Explicación de Koli</DialogTitle>
                        <DialogDescription>
                            Aquí tienes un análisis más detallado de la respuesta.
                        </DialogDescription>
                    </DialogHeader>
                     <div className="py-4">
                        {isExplanationLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">{explanation?.explanation}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsExplanationDialogOpen(false)}>Entendido</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </main>
    </div>
  );
}

    