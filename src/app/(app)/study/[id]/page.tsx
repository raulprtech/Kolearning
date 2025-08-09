
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
import { Flame, Lightbulb, Repeat, BrainCircuit, Loader2, Zap, Brain, Award, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProjects } from "@/contexts/ProjectContext";
import { explainCorrectAnswer, ExplainCorrectAnswerOutput } from "@/ai/flows/koli-explain-answer";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const MultipleChoiceQuestion = ({ atom, onAnswer }: { atom: any, onAnswer: (isCorrect: boolean) => void }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

    useEffect(() => {
        // In a real app, incorrect options would come from the data or be generated.
        const incorrectOptions = [
            "Es el principio que dice que las partículas solo pueden existir en un estado a la vez.",
            "Una teoría sobre la gravedad a nivel subatómico.",
            "La idea de que las partículas se comunican más rápido que la luz."
        ];
        const options = [atom.answer, ...incorrectOptions];
        // Shuffle the options only on the client-side
        setShuffledOptions(options.sort(() => Math.random() - 0.5));
    }, [atom.answer]);

    const handleSelectOption = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        setIsAnswered(true);
        setTimeout(() => {
            onAnswer(option === atom.answer);
            setIsAnswered(false);
            setSelectedOption(null);
        }, 1000); // Wait a second before moving to the next question
    };

    const getButtonVariant = (option: string) => {
        if (!isAnswered) return "outline";
        if (option === atom.answer) return "success";
        if (option === selectedOption && option !== atom.answer) return "destructive";
        return "outline";
    };

    return (
        <div className="mt-6 flex flex-col gap-4">
            {shuffledOptions.map((option, index) => (
                <Button
                    key={index}
                    variant={getButtonVariant(option) as any}
                    size="lg"
                    className="h-auto py-3 justify-start"
                    onClick={() => handleSelectOption(option)}
                >
                    {option}
                </Button>
            ))}
        </div>
    );
};


export default function StudySessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { 
      projects, 
      energy, 
      sessionStreak, 
      cognitiveCredits, 
      masteryPoints, 
      updateEnergy, 
      updateStreak, 
      resetSessionStats 
  } = useProjects();
  
  const projectId = params.id as string;
  const sessionIndex = parseInt(searchParams.get('sessionIndex') || '0', 10);
  
  const project = projects.find(p => p.id === projectId);
  const session = project?.sessions[sessionIndex];

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionAtoms, setSessionAtoms] = useState(project?.atoms || []);
  const [viewState, setViewState] = useState<'question' | 'answer'>('question');
  const [userAnswer, setUserAnswer] = useState("");
  const [aidsUsed, setAidsUsed] = useState(false);
  
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);
  const [explanation, setExplanation] = useState<ExplainCorrectAnswerOutput | null>(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);

  useEffect(() => {
    if (project) {
      // In a real scenario, you'd filter atoms based on the session type and FSRS data.
      // For now, we'll just use all atoms for any session.
      setSessionAtoms(project.atoms);
    }
     // Reset streak and other session stats at the beginning of a session
    resetSessionStats();
  }, [project, resetSessionStats]);

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

  const handleUseEnergy = (cost: number, isConsideredAid: boolean = true) => {
      if (energy >= cost) {
          updateEnergy(-cost);
          if (isConsideredAid) {
            setAidsUsed(true);
          }
          return true;
      }
      return false;
  }

  const handleCheckAnswer = () => {
    setViewState('answer');
  }

  const goToNextCard = () => {
    if (currentCardIndex < sessionAtoms.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setViewState('question');
      setUserAnswer("");
      setAidsUsed(false); // Reset aids for the next card
    } else {
      // Last card, go to summary
      router.push(`/study/${projectId}/summary?sessionIndex=${sessionIndex}&fsrs=4`); // Assume good rating for now
    }
  }

  const handleRate = (fsrs: number) => {
    let finalFsrs = fsrs;
    if (aidsUsed && fsrs > 2) {
        finalFsrs = 2; // Cap rating at "Difficult" if aids were used
    }
    const isCorrect = finalFsrs >= 3; // "Bien" or "Fácil"
    updateStreak(isCorrect);
    goToNextCard();
  };
  
  const handleMultipleChoiceAnswer = (isCorrect: boolean) => {
    updateStreak(isCorrect);
    // For simplicity, we'll use a fixed FSRS rating for multiple choice.
    // In a real app, this might be handled differently.
    goToNextCard();
  };

  const handleExplainAnswer = async () => {
      if (!handleUseEnergy(1)) return;
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

  const progress = (currentCardIndex / sessionAtoms.length) * 100;
  const TacticalButton = ({ icon, label, cost, action, disabled = false }: { icon: React.ReactNode, label: string, cost: number, action: () => void, disabled?: boolean }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label={label} onClick={action} disabled={disabled || energy < cost}>
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{label} (⚡-{cost})</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  )

  const isMultipleChoice = session.questions === "Opción Múltiple";


  const renderQuestionInterface = () => {
    if (isMultipleChoice) {
        return <MultipleChoiceQuestion atom={currentAtom} onAnswer={handleMultipleChoiceAnswer} />;
    }
    // Default to open question
    return (
        <>
            <Textarea
                rows={8}
                placeholder="Tu respuesta..."
                className="bg-background text-lg"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                readOnly={viewState === 'answer'}
            />
            <div className="mt-6 flex justify-center">
                <Button size="lg" className="w-full max-w-xs" onClick={handleCheckAnswer}>
                    Comprobar
                </Button>
            </div>
        </>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh)]">
       <header className="flex items-center justify-between p-4 border-b border-border gap-4 shrink-0">
            <div className="w-1/4">
                <Button variant="outline" onClick={() => router.back()}>Salir de la Sesión</Button>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-md flex flex-col items-center">
                    <Badge variant="secondary" className="mb-2">{session.type}</Badge>
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground mt-1 text-center">Preguntas restantes: {sessionAtoms.length - currentCardIndex}/{sessionAtoms.length}</p>
                </div>
            </div>
            <div className="w-1/4 flex justify-end">
                <div className="flex items-center gap-6 bg-card/50 px-4 py-1.5 rounded-md">
                    <div className="flex items-center gap-2" title="Puntos de Dominio">
                        <Award className="h-5 w-5 text-green-400" />
                        <span className="font-bold text-lg">{masteryPoints}</span>
                    </div>
                    <div className="flex items-center gap-2" title="Créditos Cognitivos">
                        <Brain className="h-5 w-5 text-blue-400" />
                        <span className="font-bold text-lg">{cognitiveCredits}</span>
                    </div>
                    <div className="flex items-center gap-2" title="Energía de Sesión">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        <span className="font-bold text-lg text-foreground">{energy}</span>
                    </div>
                </div>
            </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
            <div className="w-full max-w-3xl">
                <Card className="bg-card/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    {aidsUsed && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-yellow-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Has usado ayuda. La calificación será ajustada.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-center">
                    {currentAtom.question}
                    </CardTitle>
                    <CardDescription className="text-center">
                      {isMultipleChoice ? "Selecciona la respuesta correcta." : "Formula tu respuesta a continuación. El recuerdo activo es clave para el dominio."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    
                    {viewState === 'question' && renderQuestionInterface()}


                    <div className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center">
                    <h3 className="font-headline text-muted-foreground mb-4">
                        Soporte Táctico
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                        <TacticalButton icon={<Lightbulb/>} label="Pista" cost={1} action={() => handleUseEnergy(1)} disabled={viewState === 'answer'} />
                        <TacticalButton icon={<BrainCircuit/>} label="Explicar Respuesta" cost={1} action={handleExplainAnswer} disabled={viewState === 'question'} />
                        <TacticalButton icon={<Repeat/>} label="Reformular" cost={1} action={() => handleUseEnergy(1)} disabled={viewState === 'answer'} />
                        <TacticalButton icon={<KoliAvatar className="h-6 w-6"/>} label="Consultar a Koli" cost={3} action={() => handleUseEnergy(3)} disabled={viewState === 'answer'} />
                    </div>
                    </div>
                    
                    {viewState === 'answer' && !isMultipleChoice && (
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
