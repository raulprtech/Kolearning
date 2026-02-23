"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { useProjects, Atom as ProjectAtom } from "@/contexts/ProjectContext";
import { explainCorrectAnswer, ExplainCorrectAnswerOutput } from "@/ai/flows/koli-explain-answer";
import { getStudyAid } from "@/ai/flows/koli-study-aids";
import { koliTutorChat } from "@/ai/flows/koli-tutor-chat";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { verifyAnswer, VerifyAnswerOutput } from "@/ai/flows/koli-verify-answer";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import AssociationQuestion from "@/components/ui/study/AssociationQuestion";
import FillBlankQuestion from "@/components/ui/study/FillBlankQuestion";
import ScenarioQuestion from "@/components/ui/study/ScenarioQuestion";
import KoliIgnoranteChat from "@/components/ui/study/KoliIgnoranteChat";
import ZettelkastenNote from "@/components/ui/study/ZettelkastenNote";
import { VideoReviewQuestion } from "@/components/ui/study/VideoReviewQuestion";
import { MatchingGameQuestion } from "@/components/ui/study/MatchingGameQuestion";


const ratings = [
    { label: "Muy Difícil", variant: "destructive", description: "Repetir Pronto", fsrs: 1 },
    { label: "Difícil", variant: "outline", description: "Revisar en un día", fsrs: 2 },
    { label: "Bien", variant: "secondary", description: "Revisar en unos días", fsrs: 3 },
    { label: "Fácil", variant: "default", description: "Revisar en una semana", fsrs: 4 },
] as const;

// Correctly typed SortableItem
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

// Correctly typed OrderingQuestion
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

// Correctly typed MultipleChoiceQuestion
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
                // Usa los distractores pre-generados
                options = [atom.answer, ...atom.incorrectAnswers];
            } else {
                // Fallback: si no hay distractores, genéralos ahora
                console.warn(`No pre-generated distractors for: "${atom.question}". Generating them now.`);
                try {
                    const { generateDistractors } = await import('@/ai/flows/generate-distractors');
                    const response = await generateDistractors({
                        question: atom.question,
                        answer: atom.answer,
                        count: 3,
                    });
                    options = [atom.answer, ...response.distractors];
                } catch (error) {
                    console.error("Error generating fallback distractors:", error);
                    // Opciones de respaldo en caso de error
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

// Correctly typed KoliTutorPanel
type KoliTutorPanelProps = {
    isOpen: boolean;
    onClose: () => void;
    question: string;
    answer: string;
    onUseEnergy: (cost: number) => boolean;
};

const KoliTutorPanel = ({ isOpen, onClose, question, answer, onUseEnergy }: KoliTutorPanelProps) => {
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
            const response = await koliTutorChat({
                questionContext: question,
                answerContext: answer,
                chatHistory: [...messages, userMessage],
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
                        <div className="space-y-4" ref={scrollAreaRef}>
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


export default function StudySessionPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const {
        projects,
        completeSession,
        recordAnswer,
        resetSessionStats,
        updateAtom,
        isAuthenticated
    } = useProjects();

    const projectId = params.id as string;
    const sessionIndex = parseInt(searchParams.get('sessionIndex') || '0', 10);

    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
    const session = useMemo(() => project?.sessions[sessionIndex], [project, sessionIndex]);

    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [sessionAtoms, setSessionAtoms] = useState(session?.atoms || []);
    const [viewState, setViewState] = useState<'question' | 'answer'>('question');
    const [userAnswer, setUserAnswer] = useState("");
    const [userOrderingAnswer, setUserOrderingAnswer] = useState<string[]>([]);
    const [aidsUsed, setAidsUsed] = useState<string[]>([]);
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
            // Use a timeout to allow state updates to propagate before navigating.
            setTimeout(() => {
                router.push(`/study/${projectId}/session/summary?sessionIndex=${sessionIndex}`);
            }, 100);
        }
    }, [isSessionFinished, router, projectId, sessionIndex]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (session) {
            setSessionAtoms(session.atoms);
            resetSessionStats();
            setQuestionStartTime(Date.now());
        }
        // ONLY reset when the actual session context changes (project ID or session index)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, sessionIndex]);

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
        const index = project.atoms.findIndex(atom => normalizeText(atom.question) === normalizedQuestion);
        return index;
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

        if (projectId && currentAtomProjectIndex !== -1) {
            console.log(`[Study] Recording answer for atom ${currentAtomProjectIndex}. Correct: ${isCorrect}, responseTime: ${responseTime}ms`);
            recordAnswer(projectId, currentAtomProjectIndex, fsrs, isCorrect, responseTime, aidsUsed);
        } else {
            console.warn(`[Study] ⚠️ SKIPPING recordAnswer! projectId: ${projectId}, atomIdx: ${currentAtomProjectIndex}`);
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
    }, [isOrdering, userOrderingAnswer, currentAtom, isMultipleChoice, isConvertedToMc, userAnswer, verificationResult, recordAnswer, projectId, currentAtomProjectIndex, aidsUsed, currentCardIndex, sessionAtoms.length, router, sessionIndex, questionStartTime]);


    if (!isAuthenticated) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="mt-4 text-muted-foreground">Redirigiendo a inicio de sesión...</p>
            </div>
        );
    }

    if (!project || !session) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center">
                <h1 className="text-2xl">Sesión no encontrada</h1>
                <Button onClick={() => router.push('/study')} className="mt-4">Volver a Estudio</Button>
            </div>
        )
    }

    const handleCheckAnswer = async () => {
        if (!userAnswer.trim()) return;

        setIsVerifying(true);
        setVerificationResult(null);
        try {
            const result = await verifyAnswer({
                question: currentAtom.question,
                correctAnswer: currentAtom.answer,
                userAnswer: userAnswer,
            });
            setVerificationResult(result);
        } catch (error) {
            console.error("Error verifying answer:", error);
            setVerificationResult({ isCorrect: false, feedback: "Hubo un problema al verificar tu respuesta. Inténtalo de nuevo." });
        } finally {
            setIsVerifying(false);
            setViewState('answer');
        }
    }

    const handleUseEnergy = (cost: number, aidType?: string) => {
        // Gamification disabled - all aids are free
        if (aidType) {
            setAidsUsed(prev => [...prev, aidType]);
        }
        return true;
    }

    const handleExplainAnswer = async () => {
        handleUseEnergy(0, 'explain');
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
            setExplanation({ explanation: "Lo siento, no pude generar una explicación en este momento.", examples: [] });
        } finally {
            setIsExplanationLoading(false);
        }
    }

    const handleGetStudyAid = async (aidType: 'hint' | 'rephrase') => {
        handleUseEnergy(0, aidType);

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
        } finally {
            setIsAidLoading(null);
        }
    }

    const handleSeeAnswer = () => {
        handleUseEnergy(0, 'seeAnswer');
        setViewState('answer');
        setIsAnswerRevealed(true);
    };


    const handleConvertToMc = () => {
        handleUseEnergy(0, 'convertToMc');
        setIsConvertedToMc(true);
    }

    const handleOpenTutorChat = () => {
        handleUseEnergy(0, 'tutorChat');
        setIsTutorPanelOpen(true);
    }

    const progress = (currentCardIndex / sessionAtoms.length) * 100;

    type TacticalButtonProps = {
        icon: React.ReactNode;
        label: string;
        action: () => void;
        disabled?: boolean;
        isLoading?: boolean;
    };

    const TacticalButton = ({ icon, label, action, disabled = false, isLoading = false }: TacticalButtonProps) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" aria-label={label} onClick={action} disabled={disabled || isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : icon}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )

    const renderQuestionInterface = () => {
        // Handle polymorphic atom types
        if (currentAtom.type === 'video_review') {
            return (
                <VideoReviewQuestion
                    atom={currentAtom}
                    onAnswerSubmit={(isCorrect, time) => handleRate(isCorrect ? 3 : 1)}
                />
            );
        }

        if (currentAtom.type === 'mini_game') {
            return (
                <MatchingGameQuestion
                    atom={currentAtom}
                    onAnswerSubmit={(isCorrect, time) => handleRate(isCorrect ? 4 : 1)}
                />
            );
        }

        // Default 'text_card' handling
        // Phase-aware rendering: dispatch to the correct component based on session phase
        if (sessionPhase === 'calibration' || isMultipleChoice || isConvertedToMc) {
            return <MultipleChoiceQuestion atom={currentAtom} onRate={handleRate} isRevealed={isAnswerRevealed} onAnswerSelect={setUserAnswer} />;
        }

        // Incursión phase: association or fill-blank
        if (sessionPhase === 'incursion') {
            const questionFormats = session?.questionFormats || '';
            // If the session includes association format, use AssociationQuestion
            if (questionFormats.includes('Asociación')) {
                // Generate association pairs from atoms in the current session
                const pairs = sessionAtoms.slice(0, Math.min(6, sessionAtoms.length)).map((atom, i) => ({
                    id: `pair-${i}`,
                    concept: atom.question,
                    definition: atom.answer,
                }));
                return (
                    <AssociationQuestion
                        pairs={pairs}
                        onComplete={(isCorrect) => {
                            handleRate(isCorrect ? 3 : 1);
                        }}
                        onAnswerSelect={setUserAnswer}
                    />
                );
            }
            // If fill-blank format
            if (questionFormats.includes('Completar')) {
                // Generate fill-blank segments from the current atom's answer
                const words = currentAtom.answer.split(' ');
                const segments = words.map((word, i) => {
                    // Make every 3rd substantial word a blank
                    const isBlank = i > 0 && i % 3 === 0 && word.length > 3;
                    return {
                        text: isBlank ? '___' : word + ' ',
                        isBlank,
                        answer: isBlank ? word : undefined,
                    };
                });
                return (
                    <FillBlankQuestion
                        segments={segments}
                        questionText={currentAtom.question}
                        onComplete={(isCorrect) => {
                            handleRate(isCorrect ? 3 : 1);
                        }}
                        onAnswerSelect={setUserAnswer}
                    />
                );
            }
            // Default incursion: open-ended textarea
            return (
                <>
                    <Textarea
                        rows={8}
                        placeholder="Escribe tu respuesta con tus propias palabras..."
                        className="bg-background text-lg"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        readOnly={viewState === 'answer'}
                    />
                    <div className="mt-6 flex justify-center">
                        <Button size="lg" className="w-full max-w-xs" onClick={handleCheckAnswer} disabled={isVerifying || !userAnswer.trim()}>
                            {isVerifying ? <Loader2 className="animate-spin" /> : "Comprobar"}
                        </Button>
                    </div>
                </>
            );
        }

        // Refuerzo phase: scenario-based reasoning
        if (sessionPhase === 'reinforcement') {
            return (
                <ScenarioQuestion
                    scenario={`Imagina que necesitas explicar o aplicar el siguiente concepto en un contexto real: ${currentAtom.question}`}
                    question={`¿Cómo aplicarías o explicarías "${currentAtom.answer}" en este contexto? Justifica tu razonamiento.`}
                    expectedAnswer={currentAtom.answer}
                    relatedConcepts={sessionAtoms.slice(0, 3).map(a => a.question)}
                    onComplete={(isCorrect) => {
                        handleRate(isCorrect ? 3 : 2);
                    }}
                    onAnswerSelect={setUserAnswer}
                />
            );
        }

        // Dominio phase: Koli Ignorante chat
        if (sessionPhase === 'mastery') {
            return (
                <KoliIgnoranteChat
                    concept={currentAtom.question}
                    expectedExplanation={currentAtom.answer}
                    onComplete={(mastered) => {
                        handleRate(mastered ? 4 : 2);
                    }}
                    onAnswerSelect={setUserAnswer}
                />
            );
        }

        // Legacy ordering fallback
        if (isOrdering) {
            return <OrderingQuestion atom={currentAtom} onRate={handleRate} onAnswerSelect={setUserOrderingAnswer} />;
        }

        // Default fallback: open-ended textarea
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
                    <Button size="lg" className="w-full max-w-xs" onClick={handleCheckAnswer} disabled={isVerifying || !userAnswer.trim()}>
                        {isVerifying ? <Loader2 className="animate-spin" /> : "Comprobar"}
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
                        <p className="text-xs text-muted-foreground mt-1 text-center">{currentCardIndex + 1} de {sessionAtoms.length}</p>
                    </div>
                </div>
                <div className="w-1/4 flex justify-end">
                    {/* Gamification stats removed */}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center p-4 md:p-8 overflow-y-auto">
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
                                {isOrdering ? "Arrastra y suelta los elementos para ordenarlos correctamente." : isMultipleChoice || isConvertedToMc ? "Selecciona la respuesta correcta." : "Formula tu respuesta a continuación. El recuerdo activo es clave para el dominio."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>

                            {hint && (
                                <Alert className="mb-4 bg-primary/10 border-primary/20 text-primary">
                                    <Lightbulb className="h-4 w-4 text-primary" />
                                    <AlertTitle className="flex justify-between items-center">
                                        Pista de Koli
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setHint(null)}><X className="h-4 w-4" /></Button>
                                    </AlertTitle>
                                    <AlertDescription>{hint}</AlertDescription>
                                </Alert>
                            )}

                            {viewState === 'question' && renderQuestionInterface()}

                            {viewState === 'answer' && (isMultipleChoice || isConvertedToMc || isOrdering) && renderQuestionInterface()}

                            {viewState === 'answer' && !isMultipleChoice && !isConvertedToMc && !isOrdering && (
                                <div className="mt-8 pt-6 border-t">
                                    {verificationResult && (
                                        <Alert className={cn('mb-4', verificationResult.isCorrect ? 'border-green-500/50 text-green-300' : 'border-destructive/50 text-destructive')}>
                                            <AlertTitle>{verificationResult.isCorrect ? "¡Correcto!" : "Respuesta incorrecta"}</AlertTitle>
                                            <AlertDescription>{verificationResult.feedback}</AlertDescription>
                                        </Alert>
                                    )}
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

                                    {/* Zettelkasten Note */}
                                    <ZettelkastenNote
                                        atomQuestion={currentAtom.question}
                                        atomAnswer={currentAtom.answer}
                                        existingNote={currentAtom.zettelkastenNote}
                                        onSaveNote={(note) => {
                                            if (projectId && currentAtomProjectIndex !== -1) {
                                                updateAtom(projectId, currentAtomProjectIndex, { ...currentAtom, zettelkastenNote: note });
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center">
                                <div className="flex items-center justify-center gap-4">
                                    <TacticalButton icon={<Eye />} label="Ver respuesta" action={handleSeeAnswer} disabled={viewState === 'answer'} />
                                    <TacticalButton icon={<Lightbulb />} label="Pista" action={() => handleGetStudyAid('hint')} disabled={viewState === 'answer' || !!hint} isLoading={isAidLoading === 'hint'} />
                                    {!isMultipleChoice && !isConvertedToMc && !isOrdering && <TacticalButton icon={<ListChecks />} label="Convertir a Opción Múltiple" action={handleConvertToMc} disabled={viewState === 'answer'} />}
                                    <TacticalButton icon={<BrainCircuit />} label="Explicar Respuesta" action={handleExplainAnswer} disabled={viewState === 'question'} />
                                    <TacticalButton icon={<Repeat />} label="Reformular" action={() => handleGetStudyAid('rephrase')} disabled={viewState === 'answer' || !!rephrasedQuestion} isLoading={isAidLoading === 'rephrase'} />
                                    <TacticalButton icon={<KoliAvatar className="h-6 w-6" />} label="Consultar a Koli" action={handleOpenTutorChat} />
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                <Dialog open={isExplanationDialogOpen} onOpenChange={setIsExplanationDialogOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Explicación de la Respuesta</DialogTitle>
                            <DialogDescription>
                                Koli ha generado una explicación para ayudarte a entender mejor.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 max-h-[60vh] overflow-y-auto">
                            {isExplanationLoading ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-w-none">
                                    <p>{explanation?.explanation}</p>
                                    {explanation?.examples && explanation.examples.length > 0 && (
                                        <>
                                            <h4 className="font-bold mt-4">Ejemplos:</h4>
                                            <ul className="list-disc pl-5">
                                                {explanation.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsExplanationDialogOpen(false)}>Cerrar</Button>
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
            </main >
        </div >
    );
}
