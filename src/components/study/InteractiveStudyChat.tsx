"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { KolearningAvatar } from "@/components/icons/kolearning-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Repeat, BrainCircuit, Loader2, ListChecks, Send, RefreshCw, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useProjects, Atom as ProjectAtom, Project } from "@/contexts/ProjectContext";
import { explainCorrectAnswer, ExplainCorrectAnswerOutput } from "@/ai/flows/kolearning-explain-answer";
import { getStudyAid } from "@/ai/flows/kolearning-study-aids";
import { kolearningTutorChat } from "@/ai/flows/kolearning-tutor-chat";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { verifyAnswer, VerifyAnswerOutput } from "@/ai/flows/kolearning-verify-answer";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import AssociationQuestion from "@/components/ui/study/AssociationQuestion";
import FillBlankQuestion from "@/components/ui/study/FillBlankQuestion";
import ScenarioQuestion from "@/components/ui/study/ScenarioQuestion";
import KolearningIgnoranteChat from "@/components/ui/study/KolearningIgnoranteChat";
import ZettelkastenNote from "@/components/ui/study/ZettelkastenNote";
import { VideoReviewQuestion } from "@/components/ui/study/VideoReviewQuestion";
import { MatchingGameQuestion } from "@/components/ui/study/MatchingGameQuestion";

const ratings = [
    { label: "Muy Difícil", variant: "destructive", description: "Repetir Pronto", fsrs: 1 },
    { label: "Difícil", variant: "outline", description: "Revisar en un día", fsrs: 2 },
    { label: "Bien", variant: "secondary", description: "Revisar en unos días", fsrs: 3 },
    { label: "Fácil", variant: "default", description: "Revisar en una semana", fsrs: 4 },
] as const;

type SortableItemProps = {
    id: string;
    children: React.ReactNode;
    isAnswered: boolean;
    isCorrect: boolean;
}

function SortableItem({ id, children, isAnswered, isCorrect }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getVariantClass = () => {
        if (!isAnswered) return "bg-muted";
        return isCorrect ? "bg-green-200 dark:bg-green-900" : "bg-red-200 dark:bg-red-900";
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn("p-4 rounded-md shadow-sm cursor-grab active:cursor-grabbing", getVariantClass())}>
            {children}
        </div>
    );
}

type OrderingQuestionProps = {
    atom: ProjectAtom;
    onRate: (fsrs: 1 | 2 | 3 | 4) => void;
    onAnswerSelect: (answer: string[]) => void;
};

const OrderingQuestion = ({ atom, onRate, onAnswerSelect }: OrderingQuestionProps) => {
    const [items, setItems] = useState(() => atom.orderingItems ? [...atom.orderingItems].sort(() => Math.random() - 0.5) : []);
    const [isAnswered, setIsAnswered] = useState(false);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const newItems = atom.orderingItems ? [...atom.orderingItems].sort(() => Math.random() - 0.5) : [];
        setItems(newItems);
        onAnswerSelect(newItems);
        setIsAnswered(false);
    }, [atom, onAnswerSelect]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((currentItems) => {
                const oldIndex = currentItems.indexOf(active.id as string);
                const newIndex = currentItems.indexOf(over.id as string);
                const newOrder = arrayMove(currentItems, oldIndex, newIndex);
                onAnswerSelect(newOrder);
                return newOrder;
            });
        }
    };

    const checkAnswer = () => {
        setIsAnswered(true);
    };

    if (!atom.orderingItems || atom.orderingItems.length === 0) {
        return <p>Esta pregunta de ordenamiento no está configurada correctamente.</p>;
    }

    return (
        <div className="mt-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <SortableItem
                                key={item}
                                id={item}
                                isAnswered={isAnswered}
                                isCorrect={atom.correctOrder ? item === atom.correctOrder[index] : false}
                            >
                                {item}
                            </SortableItem>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {!isAnswered ? (
                <div className="mt-6 flex justify-center">
                    <Button size="lg" onClick={checkAnswer}>Comprobar Orden</Button>
                </div>
            ) : (
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

type MultipleChoiceQuestionProps = {
    atom: ProjectAtom;
    onRate: (fsrs: 1 | 2 | 3 | 4) => void;
    isRevealed: boolean;
    onAnswerSelect: (answer: string) => void;
};

const MultipleChoiceQuestion = ({ atom, onRate, isRevealed, onAnswerSelect }: MultipleChoiceQuestionProps) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    useEffect(() => {
        const getOptions = async () => {
            setIsLoadingOptions(true);
            let options: string[] = [];

            if (atom.incorrectAnswers && atom.incorrectAnswers.length > 0) {
                options = [atom.answer, ...atom.incorrectAnswers];
            } else {
                try {
                    const { generateDistractors } = await import('@/ai/flows/generate-distractors');
                    const response = await generateDistractors({
                        question: atom.question,
                        answer: atom.answer,
                        count: 3,
                    });
                    options = [atom.answer, ...response.distractors];
                } catch (error) {
                    options = [atom.answer, "Opción A", "Opción B", "Opción C"];
                }
            }

            setShuffledOptions(options.sort(() => Math.random() - 0.5));
            setIsLoadingOptions(false);
        };

        getOptions();
        setIsAnswered(false);
        setSelectedOption(null);
    }, [atom.answer, atom.question, atom.incorrectAnswers]);

    useEffect(() => {
        if (isRevealed) {
            setIsAnswered(true);
        }
    }, [isRevealed]);

    const handleSelectOption = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        onAnswerSelect(option);
        setIsAnswered(true);
    };

    const getButtonVariant = (option: string): VariantProps<typeof buttonVariants>["variant"] => {
        if (!isAnswered) return "outline";
        if (option === atom.answer) return "success";
        if (option === selectedOption && option !== atom.answer) return "destructive";
        return "outline";
    };

    if (isLoadingOptions) {
        return (
            <div className="mt-6 flex flex-col gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    return (
        <div className="mt-6 flex flex-col gap-4">
            {shuffledOptions.map((option, index) => (
                <Button
                    key={index}
                    variant={getButtonVariant(option)}
                    size="lg"
                    className="h-auto py-3 justify-start text-left whitespace-normal"
                    onClick={() => handleSelectOption(option)}
                    disabled={isAnswered && selectedOption !== null}
                >
                    {option}
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

type ChatMessageDetail = {
    id: string;
    role: 'tutor' | 'user' | 'system';
    content: React.ReactNode;
};

type KolearningTutorPanelProps = {
    isOpen: boolean;
    onClose: () => void;
    question: string;
    answer: string;
    onUseEnergy: (cost: number) => boolean;
};

const KolearningTutorPanel = ({ isOpen, onClose, question, answer }: KolearningTutorPanelProps) => {
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
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
            scrollArea.scrollTop = scrollArea.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        try {
            const response = await kolearningTutorChat({
                questionContext: question,
                answerContext: answer,
                chatHistory: [...messages, userMessage],
            });
            setMessages(prev => [...prev, { role: 'model', content: response.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', content: "Lo siento, tuve un problema para procesar tu pregunta." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:w-[540px] flex flex-col">
                <SheetHeader>
                    <SheetTitle>Consulta a Kolearning</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div className="space-y-4" ref={scrollAreaRef}>
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex gap-3 ${msg.role === 'model' ? '' : 'justify-end'}`}>
                                    {msg.role === 'model' && <KolearningAvatar className="h-8 w-8 flex-shrink-0" />}
                                    <div className={`p-3 rounded-lg max-w-sm ${msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <KolearningAvatar className="h-8 w-8 flex-shrink-0" />
                                    <div className="p-3 rounded-lg bg-muted flex items-center">
                                        <Loader2 className="h-5 w-5 animate-spin" />
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
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
};

export interface InteractiveStudyChatProps {
    project: Project;
    sessionIndex: number;
    onComplete?: () => void;
}

export function InteractiveStudyChat({ project, sessionIndex, onComplete }: InteractiveStudyChatProps) {
    const router = useRouter();
    const {
        recordAnswer,
        resetSessionStats,
        updateAtom,
    } = useProjects();

    const session = useMemo(() => project.sessions[sessionIndex], [project, sessionIndex]);

    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [sessionAtoms, setSessionAtoms] = useState(session?.atoms || []);
    const [viewState, setViewState] = useState<'question' | 'answer'>('question');
    const [userAnswer, setUserAnswer] = useState("");
    const [userOrderingAnswer, setUserOrderingAnswer] = useState<string[]>([]);
    const [aidsUsed, setAidsUsed] = useState<string[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessageDetail[]>([]);
    const mainScrollRef = useRef<HTMLDivElement>(null);
    const [isConvertedToMc, setIsConvertedToMc] = useState(false);
    const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerifyAnswerOutput | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());

    const [isSessionFinished, setIsSessionFinished] = useState(false);
    const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);
    const [explanation, setExplanation] = useState<ExplainCorrectAnswerOutput | null>(null);
    const [isExplanationLoading, setIsExplanationLoading] = useState(false);

    const [isAidLoading, setIsAidLoading] = useState<string | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [rephrasedQuestion, setRephrasedQuestion] = useState<string | null>(null);
    const [isTutorPanelOpen, setIsTutorPanelOpen] = useState(false);

    useEffect(() => {
        if (isSessionFinished) {
            if (onComplete) {
                onComplete();
            } else {
                router.push(`/study/${project.id}/session/summary?sessionIndex=${sessionIndex}`);
            }
        }
    }, [isSessionFinished, router, project.id, sessionIndex, onComplete]);

    useEffect(() => {
        if (session) {
            setSessionAtoms(session.atoms);
            resetSessionStats();
            setQuestionStartTime(Date.now());
            setChatHistory([]);
            setCurrentCardIndex(0);
        }
    }, [project.id, sessionIndex]);

    useEffect(() => {
        if (mainScrollRef.current) {
            mainScrollRef.current.scrollTop = mainScrollRef.current.scrollHeight;
        }
    }, [chatHistory, viewState, currentCardIndex]);

    const currentAtom: ProjectAtom = useMemo(() => {
        if (!sessionAtoms || sessionAtoms.length === 0 || currentCardIndex >= sessionAtoms.length) {
            return { question: "Cargando pregunta...", answer: "" };
        }
        return sessionAtoms[currentCardIndex];
    }, [sessionAtoms, currentCardIndex]);

    const normalizeText = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');

    const currentAtomProjectIndex = useMemo(() => {
        if (!project || !currentAtom?.question) return -1;
        const normalizedQuestion = normalizeText(currentAtom.question);
        return project.atoms.findIndex(atom => normalizeText(atom.question) === normalizedQuestion);
    }, [project, currentAtom]);

    const isMultipleChoice = useMemo(() => session?.questions === "Opción Múltiple", [session]);
    const isOrdering = useMemo(() => session?.questions === "Ordenamiento", [session]);
    const sessionPhase = useMemo(() => session?.phase || 'calibration', [session]);

    const handleRate = useCallback((fsrs: 1 | 2 | 3 | 4) => {
        let isCorrect = false;
        if (isOrdering) {
            isCorrect = currentAtom.correctOrder ? JSON.stringify(userOrderingAnswer) === JSON.stringify(currentAtom.correctOrder) : false;
        } else if (isMultipleChoice || isConvertedToMc) {
            isCorrect = userAnswer === currentAtom.answer;
        } else {
            isCorrect = verificationResult?.isCorrect ?? false;
        }

        const responseTime = Date.now() - questionStartTime;
        let displayUserAnswer = userAnswer;
        if (isOrdering) displayUserAnswer = userOrderingAnswer.join(", ");
        if (!displayUserAnswer) displayUserAnswer = "Interacción directa.";

        setChatHistory(prev => [
            ...prev,
            { id: `tq-${currentCardIndex}-${Date.now()}`, role: 'tutor', content: <p className="font-medium">{rephrasedQuestion || currentAtom.question}</p> },
            { id: `ua-${currentCardIndex}-${Date.now()}`, role: 'user', content: <p className="text-base">{displayUserAnswer}</p> },
            { 
               id: `tf-${currentCardIndex}-${Date.now()}`, 
               role: 'tutor', 
               content: (
                   <div className="space-y-3">
                       <p className={cn("font-medium", isCorrect ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                           {isCorrect ? "¡Correcto!" : "¡Casi! Esta era la respuesta sugerida:"}
                       </p>
                       <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                           <p className="text-sm font-medium text-foreground">{currentAtom.answer}</p>
                       </div>
                       <p className="text-xs text-muted-foreground flex justify-end items-center gap-1">
                          Evaluación: 
                          <Badge variant={ratings.find(r => r.fsrs === fsrs)?.variant as any} className="text-[10px] h-4 leading-none py-0">
                             {ratings.find(r => r.fsrs === fsrs)?.label}
                          </Badge>
                       </p>
                   </div>
               )
            }
        ]);

        if (project.id && currentAtomProjectIndex !== -1) {
            recordAnswer(project.id, currentAtomProjectIndex, fsrs, isCorrect, responseTime, aidsUsed);
        }

        if (currentCardIndex < sessionAtoms.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
            setViewState('question');
            setUserAnswer("");
            setUserOrderingAnswer([]);
            setVerificationResult(null);
            setAidsUsed([]);
            setIsConvertedToMc(false);
            setIsAnswerRevealed(false);
            setHint(null);
            setRephrasedQuestion(null);
            setQuestionStartTime(Date.now());
        } else {
            setIsSessionFinished(true);
        }
    }, [isOrdering, userOrderingAnswer, currentAtom, isMultipleChoice, isConvertedToMc, userAnswer, verificationResult, recordAnswer, project.id, currentAtomProjectIndex, aidsUsed, currentCardIndex, sessionAtoms.length, questionStartTime, rephrasedQuestion]);

    const handleCheckAnswer = async () => {
        if (!userAnswer.trim()) return;
        setIsVerifying(true);
        try {
            const result = await verifyAnswer({
                question: currentAtom.question,
                correctAnswer: currentAtom.answer,
                userAnswer: userAnswer,
            });
            setVerificationResult(result);
        } catch (error) {
            setVerificationResult({ isCorrect: false, feedback: "Error al verificar." });
        } finally {
            setIsVerifying(false);
            setViewState('answer');
        }
    }

    const handleExplainAnswer = async () => {
        setAidsUsed(prev => [...prev, 'explain']);
        setIsExplanationDialogOpen(true);
        setIsExplanationLoading(true);
        try {
            const result = await explainCorrectAnswer({
                question: currentAtom.question,
                correctAnswer: currentAtom.answer,
                learnerAnswer: userAnswer,
                context: `Sesión "${session.type}" proyecto "${project.title}".`
            });
            setExplanation(result);
        } catch (error) {
            setExplanation({ explanation: "Error.", examples: [] });
        } finally {
            setIsExplanationLoading(false);
        }
    }

    const handleGetStudyAid = async (aidType: 'hint' | 'rephrase') => {
        setAidsUsed(prev => [...prev, aidType]);
        setIsAidLoading(aidType);
        try {
            const result = await getStudyAid({
                aidType,
                question: currentAtom.question,
                answer: currentAtom.answer,
            });
            if (aidType === 'hint') setHint(result.result);
            else setRephrasedQuestion(result.result);
        } catch (error) {} finally {
            setIsAidLoading(null);
        }
    }

    const handleSeeAnswer = () => {
        setAidsUsed(prev => [...prev, 'seeAnswer']);
        setViewState('answer');
        setIsAnswerRevealed(true);
    };

    const handleConvertToMc = () => {
        setAidsUsed(prev => [...prev, 'convertToMc']);
        setIsConvertedToMc(true);
    }

    const handleOpenTutorChat = () => {
        setAidsUsed(prev => [...prev, 'tutorChat']);
        setIsTutorPanelOpen(true);
    }

    const TacticalButton = ({ icon, label, action, disabled = false, isLoading = false }: any) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={action} disabled={disabled || isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : icon}
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{label}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )

    const renderQuestionInterface = () => {
        if (currentAtom.type === 'video_review') {
            return <VideoReviewQuestion atom={currentAtom} onAnswerSubmit={(isCorrect) => handleRate(isCorrect ? 3 : 1)} />;
        }
        if (currentAtom.type === 'mini_game') {
            return <MatchingGameQuestion atom={currentAtom} onAnswerSubmit={(isCorrect) => handleRate(isCorrect ? 4 : 1)} />;
        }
        if (sessionPhase === 'calibration' || isMultipleChoice || isConvertedToMc) {
            return <MultipleChoiceQuestion atom={currentAtom} onRate={handleRate} isRevealed={isAnswerRevealed} onAnswerSelect={setUserAnswer} />;
        }
        if (sessionPhase === 'incursion') {
            const formats = session?.questionFormats || '';
            if (formats.includes('Asociación')) {
                const pairs = sessionAtoms.slice(0, 6).map((a, i) => ({ id: `p-${i}`, concept: a.question, definition: a.answer }));
                return <AssociationQuestion pairs={pairs} onComplete={(isCorrect) => handleRate(isCorrect ? 3 : 1)} onAnswerSelect={setUserAnswer} />;
            }
            if (formats.includes('Completar')) {
                const words = currentAtom.answer.split(' ');
                const segments = words.map((w, i) => {
                    const isBlank = i > 0 && i % 3 === 0 && w.length > 3;
                    return { text: isBlank ? '___' : w + ' ', isBlank, answer: isBlank ? w : undefined };
                });
                return <FillBlankQuestion segments={segments} questionText={currentAtom.question} onComplete={(isCorrect) => handleRate(isCorrect ? 3 : 1)} onAnswerSelect={setUserAnswer} />;
            }
            return (
                <div className="space-y-4">
                    <Textarea rows={6} placeholder="Respuesta..." className="bg-background" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} readOnly={viewState === 'answer'} />
                    <Button size="lg" className="w-full" onClick={handleCheckAnswer} disabled={isVerifying || !userAnswer.trim()}>{isVerifying ? <Loader2 className="animate-spin" /> : "Comprobar"}</Button>
                </div>
            );
        }
        if (sessionPhase === 'reinforcement') {
            return <ScenarioQuestion scenario={`Contexto: ${currentAtom.question}`} question={`¿Cómo aplicarías "${currentAtom.answer}"?`} expectedAnswer={currentAtom.answer} onComplete={(isCorrect) => handleRate(isCorrect ? 3 : 2)} onAnswerSelect={setUserAnswer} />;
        }
        if (sessionPhase === 'mastery') {
            return <KolearningIgnoranteChat concept={currentAtom.question} expectedExplanation={currentAtom.answer} onComplete={(m) => handleRate(m ? 4 : 2)} onAnswerSelect={setUserAnswer} />;
        }
        if (isOrdering) {
            return <OrderingQuestion atom={currentAtom} onRate={handleRate} onAnswerSelect={setUserOrderingAnswer} />;
        }
        return (
            <div className="space-y-4">
                <Textarea rows={6} placeholder="Respuesta..." className="bg-background" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} readOnly={viewState === 'answer'} />
                <Button size="lg" className="w-full" onClick={handleCheckAnswer} disabled={isVerifying || !userAnswer.trim()}>{isVerifying ? <Loader2 className="animate-spin" /> : "Comprobar"}</Button>
            </div>
        );
    }

    const questionToDisplay = rephrasedQuestion || currentAtom.question;

    return (
        <div className="flex flex-col h-full w-full bg-muted/5 rounded-xl overflow-hidden border shadow-inner">
            <main className="flex-1 overflow-y-auto w-full relative" ref={mainScrollRef}>
                <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 pb-24">
                    {chatHistory.length === 0 && (
                        <div className="flex justify-center py-8">
                            <Badge variant="outline" className="text-muted-foreground">Sesión Iniciada: {session.type}</Badge>
                        </div>
                    )}
                    {chatHistory.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'tutor' && <KolearningAvatar className="h-8 w-8 shrink-0 mt-1" />}
                            <div className={`p-3 max-w-[90%] shadow-sm ${
                                msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm text-sm' : 
                                'bg-background border rounded-2xl rounded-tl-sm text-sm'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {!isSessionFinished && (
                        <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <KolearningAvatar className="h-8 w-8 shrink-0 mt-1" />
                            <div className="p-0 bg-transparent w-full space-y-3">
                                <div className="p-3 rounded-2xl bg-background border rounded-tl-sm shadow-sm relative group">
                                    <p className="font-semibold text-base">{questionToDisplay}</p>
                                    {hint && (
                                        <Alert className="mt-3 bg-primary/5 py-2">
                                            <Lightbulb className="h-3 w-3" />
                                            <AlertDescription className="text-xs">{hint}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                                <div className="w-full">
                                    {viewState === 'question' ? renderQuestionInterface() : (
                                        (isMultipleChoice || isConvertedToMc || isOrdering) ? renderQuestionInterface() : (
                                            <div className="bg-background rounded-xl p-4 border shadow-sm space-y-4">
                                                {verificationResult && (
                                                    <Alert variant={verificationResult.isCorrect ? "default" : "destructive"} className="py-2">
                                                        <AlertDescription className="text-xs">{verificationResult.feedback}</AlertDescription>
                                                    </Alert>
                                                )}
                                                <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                                                    <p className="text-xs font-bold text-primary mb-1 uppercase">Respuesta Correcta</p>
                                                    <p className="text-sm">{currentAtom.answer}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {ratings.map(rating => (
                                                        <Button key={rating.label} variant={rating.variant} className="h-auto py-2 flex-col" onClick={() => handleRate(rating.fsrs)}>
                                                            <span className="text-xs font-bold">{rating.label}</span>
                                                            <span className="text-[10px] opacity-70">{rating.description}</span>
                                                        </Button>
                                                    ))}
                                                </div>
                                                <ZettelkastenNote
                                                    atomQuestion={currentAtom.question}
                                                    atomAnswer={currentAtom.answer}
                                                    existingNote={currentAtom.zettelkastenNote}
                                                    onSaveNote={(note) => updateAtom(project.id, currentAtomProjectIndex, { ...currentAtom, zettelkastenNote: note })}
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <TacticalButton icon={<Eye className="h-4 w-4" />} label="Ver respuesta" action={handleSeeAnswer} disabled={viewState === 'answer'} />
                                    <TacticalButton icon={<Lightbulb className="h-4 w-4" />} label="Pista" action={() => handleGetStudyAid('hint')} disabled={viewState === 'answer' || !!hint} />
                                    {!isMultipleChoice && !isConvertedToMc && !isOrdering && <TacticalButton icon={<ListChecks className="h-4 w-4" />} label="Opción Múltiple" action={handleConvertToMc} /> }
                                    <TacticalButton icon={<BrainCircuit className="h-4 w-4" />} label="Explicar" action={handleExplainAnswer} />
                                    <Button variant="ghost" size="sm" className="ml-auto h-8 text-xs" onClick={handleOpenTutorChat}>
                                        <KolearningAvatar className="h-4 w-4 mr-1" /> Chatear
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Dialog open={isExplanationDialogOpen} onOpenChange={setIsExplanationDialogOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Explicación</DialogTitle></DialogHeader>
                        <div className="prose prose-sm dark:prose-invert">
                            <p>{explanation?.explanation}</p>
                            {explanation?.examples?.map((ex, i) => <li key={i}>{ex}</li>)}
                        </div>
                        <DialogFooter><Button onClick={() => setIsExplanationDialogOpen(false)}>Cerrar</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                <KolearningTutorPanel isOpen={isTutorPanelOpen} onClose={() => setIsTutorPanelOpen(false)} question={currentAtom.question} answer={currentAtom.answer} onUseEnergy={() => true} />
            </main>
        </div>
    );
}
