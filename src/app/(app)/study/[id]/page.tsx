
"use client"

import { useMemo, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { KoliAvatar } from "@/components/icons/koli-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Lightbulb, Repeat, BrainCircuit, Loader2, Zap, Brain, Award, ListChecks, Send, RefreshCw, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProjects } from "@/contexts/ProjectContext";
import { explainCorrectAnswer, ExplainCorrectAnswerOutput } from "@/ai/flows/koli-explain-answer";
import { getStudyAid } from "@/ai/flows/koli-study-aids";
import { koliTutorChat } from "@/ai/flows/koli-tutor-chat";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";


const ratings = [
    { label: "Muy Difícil", variant: "destructive", description: "Repetir Pronto", fsrs: 1 },
    { label: "Difícil", variant: "outline", description: "Revisar en un día", fsrs: 2 },
    { label: "Bien", variant: "secondary", description: "Revisar en unos días", fsrs: 3 },
    { label: "Fácil", variant: "default", description: "Revisar en una semana", fsrs: 4 },
] as const;

const MultipleChoiceQuestion = ({ atom, onRate, isRevealed }: { atom: any, onRate: (fsrs: number) => void, isRevealed: boolean }) => {
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
        // Shuffle options on client-side to prevent hydration mismatch
        const options = [atom.answer, ...incorrectOptions];
        setShuffledOptions(options.sort(() => Math.random() - 0.5));
        
        // Reset state when atom changes
        setIsAnswered(false);
        setSelectedOption(null);

    }, [atom.answer, atom.question]);
    
    useEffect(() => {
        if(isRevealed) {
            setIsAnswered(true);
        }
    }, [isRevealed]);

    const handleSelectOption = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        setIsAnswered(true);
        // Don't auto-advance. Wait for FSRS rating.
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
                    className="h-auto py-3 justify-start text-left whitespace-normal"
                    onClick={() => handleSelectOption(option)}
                    disabled={isAnswered}
                >
                    <div className="text-left">{option}</div>
                </Button>
            ))}
            {isAnswered && (
                 <div className="mt-8 pt-6 border-t">
                    <h3 className="font-headline text-muted-foreground mb-4 text-center">
                        Califica tu rendimiento de recuerdo:
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {ratings.map(rating => (
                            <Button key={rating.label} variant={rating.variant} className="h-auto py-3 flex-col w-full" onClick={() => onRate(rating.fsrs)}>
                                <span className="text-lg font-bold">{rating.label}</span>
                                <span className="text-xs opacity-80">{rating.description}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

const KoliTutorPanel = ({ isOpen, onClose, question, answer, onUseEnergy }: { isOpen: boolean, onClose: () => void, question: string, answer: string, onUseEnergy: (cost: number) => boolean }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([
                { role: 'model', content: `¡Hola! Estoy aquí para ayudarte con la pregunta: "${question}". ¿Qué duda tienes?` }
            ]);
        }
    }, [isOpen, question]);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const newMessages: ChatMessage[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await koliTutorChat({
                questionContext: question,
                answerContext: answer,
                chatHistory: newMessages,
            });
            setMessages(prev => [...prev, { role: 'model', content: response.response }]);
        } catch (error) {
            console.error("Error chatting with Koli:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Lo siento, tuve un problema para procesar tu pregunta. Inténtalo de nuevo." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:w-[540px] flex flex-col">
                <SheetHeader>
                    <SheetTitle>Consulta a Koli</SheetTitle>
                    <SheetDescription>
                        Chatea con tu tutor de IA para resolver tus dudas sobre este tema.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div ref={scrollAreaRef} className="space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex gap-3 ${msg.role === 'model' ? '' : 'justify-end'}`}>
                                    {msg.role === 'model' && <KoliAvatar className="h-8 w-8 flex-shrink-0" />}
                                    <div className={`p-3 rounded-lg max-w-sm ${msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <KoliAvatar className="h-8 w-8 flex-shrink-0" />
                                    <div className="p-3 rounded-lg bg-muted flex items-center">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <SheetFooter>
                    <div className="relative w-full">
                        <Input
                            placeholder="Escribe tu pregunta..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isLoading}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim()}
                        >
                            <Send className="h-4 w-4"/>
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
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
      recordAnswer, 
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
  const [isConvertedToMc, setIsConvertedToMc] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);
  const [explanation, setExplanation] = useState<ExplainCorrectAnswerOutput | null>(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);

  const [isAidLoading, setIsAidLoading] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [rephrasedQuestion, setRephrasedQuestion] = useState<string | null>(null);
  const [isTutorPanelOpen, setIsTutorPanelOpen] = useState(false);


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
  
  const currentAtomProjectIndex = useMemo(() => {
    if (!project || !currentAtom) return -1;
    return project.atoms.findIndex(atom => atom.question === currentAtom.question);
  }, [project, currentAtom]);

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
      setIsConvertedToMc(false); // Reset conversion for next card
      setIsAnswerRevealed(false); // Reset reveal for next card
      setHint(null);
      setRephrasedQuestion(null);
    } else {
      // Last card, go to summary
      router.push(`/study/${projectId}/summary?sessionIndex=${sessionIndex}`);
    }
  }

  const handleRate = (fsrs: number) => {
    recordAnswer(projectId, currentAtomProjectIndex, fsrs, aidsUsed);
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

  const handleGetStudyAid = async (aidType: 'hint' | 'rephrase') => {
      const cost = aidType === 'hint' ? 1 : 1;
      if (!handleUseEnergy(cost)) return;

      setIsAidLoading(aidType);
      try {
          const result = await getStudyAid({
              aidType,
              question: currentAtom.question,
              answer: currentAtom.answer,
          });

          if (aidType === 'hint') {
              setHint(result.result);
          } else {
              setRephrasedQuestion(result.result);
          }
      } catch (error) {
          console.error(`Error getting ${aidType}:`, error);
          // Optionally show a toast or message
      } finally {
          setIsAidLoading(null);
      }
  }

  const handleSeeAnswer = () => {
    if (handleUseEnergy(5)) {
      setViewState('answer');
      setIsAnswerRevealed(true);
    }
  };


  const handleConvertToMc = () => {
    if (handleUseEnergy(2)) {
        setIsConvertedToMc(true);
    }
  }

  const handleOpenTutorChat = () => {
    if (handleUseEnergy(3)) {
        setIsTutorPanelOpen(true);
    }
  }

  const progress = (currentCardIndex / sessionAtoms.length) * 100;
  const TacticalButton = ({ icon, label, cost, action, disabled = false, isLoading = false }: { icon: React.ReactNode, label: string, cost: number, action: () => void, disabled?: boolean, isLoading?: boolean }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label={label} onClick={action} disabled={disabled || energy < cost || isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : icon}
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
    if (isMultipleChoice || isConvertedToMc) {
        return <MultipleChoiceQuestion atom={currentAtom} onRate={handleRate} isRevealed={isAnswerRevealed} />;
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

  const questionToDisplay = rephrasedQuestion || currentAtom.question;

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh)]">
       <header className="flex items-center justify-between p-4 border-b border-border gap-4 shrink-0">
            <div className="w-1/4">
                <Button variant="outline" onClick={() => router.back()}>Salir de la Sesión</Button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
                 <Badge variant="secondary" className="mb-2">{session.type}</Badge>
                <div className="w-full max-w-md">
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
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-center">
                    {questionToDisplay}
                    {rephrasedQuestion && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="ml-2 h-6 w-6" onClick={() => setRephrasedQuestion(null)}>
                                        <RefreshCw className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver pregunta original</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    </CardTitle>
                    <CardDescription className="text-center">
                      {isMultipleChoice || isConvertedToMc ? "Selecciona la respuesta correcta." : "Formula tu respuesta a continuación. El recuerdo activo es clave para el dominio."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    
                     {hint && (
                        <Alert className="mb-4 bg-primary/10 border-primary/20 text-primary">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            <AlertTitle className="flex justify-between items-center">
                                Pista de Koli
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setHint(null)}><X className="h-4 w-4"/></Button>
                            </AlertTitle>
                            <AlertDescription>{hint}</AlertDescription>
                        </Alert>
                    )}
                    
                    {viewState === 'question' && renderQuestionInterface()}
                    
                    {viewState === 'answer' && (isMultipleChoice || isConvertedToMc) && renderQuestionInterface()}

                    <div className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center">
                    <h3 className="font-headline text-muted-foreground mb-4">
                        Usar ayuda
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                        <TacticalButton icon={<Eye/>} label="Ver respuesta" cost={5} action={handleSeeAnswer} disabled={viewState === 'answer'} />
                        <TacticalButton icon={<Lightbulb/>} label="Pista" cost={1} action={() => handleGetStudyAid('hint')} disabled={viewState === 'answer' || !!hint} isLoading={isAidLoading === 'hint'} />
                        {!isMultipleChoice && !isConvertedToMc && <TacticalButton icon={<ListChecks/>} label="Convertir a Opción Múltiple" cost={2} action={handleConvertToMc} disabled={viewState === 'answer'} />}
                        <TacticalButton icon={<BrainCircuit/>} label="Explicar Respuesta" cost={1} action={handleExplainAnswer} disabled={viewState === 'question'} />
                        <TacticalButton icon={<Repeat/>} label="Reformular" cost={1} action={() => handleGetStudyAid('rephrase')} disabled={viewState === 'answer' || !!rephrasedQuestion} isLoading={isAidLoading === 'rephrase'} />
                        <TacticalButton icon={<KoliAvatar className="h-6 w-6"/>} label="Consultar a Koli" cost={3} action={handleOpenTutorChat} />
                    </div>
                    </div>
                    
                    {viewState === 'answer' && !isMultipleChoice && !isConvertedToMc && (
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

            <KoliTutorPanel
                isOpen={isTutorPanelOpen}
                onClose={() => setIsTutorPanelOpen(false)}
                question={currentAtom.question}
                answer={currentAtom.answer}
                onUseEnergy={handleUseEnergy}
            />

        </main>
    </div>
  );
}

    