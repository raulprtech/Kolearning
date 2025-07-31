

'use client';
export const dynamic = 'force-dynamic';

import { useState, useMemo, useRef, useEffect, Suspense, useReducer } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, TrendingUp, CheckCircle, XCircle, Lightbulb, Repeat, Frown, Meh, Smile, RefreshCw, Eye, Bot, Star, User2, Check, SendHorizonal, GripVertical, MenuSquare, Zap, Trophy, Loader2, Award } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { handleTutorChat } from '@/app/actions/tutor';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { handleEvaluateOpenAnswer, handleGenerateOptionsForQuestion } from '@/app/actions/decks';
import { handleEndSessionAndRefinePlan, getAllProjects } from '@/app/actions/projects';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Project, Flashcard, SessionPerformanceSummary } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { SpacedRepetitionSystem, type UserRating } from '@/lib/srs';

type SessionQuestion = Flashcard & { type: 'open-answer' | 'multiple-choice' | 'matching' | 'ordering' | 'fill-in-the-blank', options?: any[], code?: string, correctAnswerText?: string, textParts?: string[], pairs?: any[], items?: any[], correctAnswer?: string };

const TutorAvatar = ({ className }: { className?: string }) => (
    <div className={cn("w-8 h-8 rounded-full bg-blue-500/50 flex items-center justify-center shrink-0", className)}>
        <div className="w-full h-full rounded-full bg-gradient-radial from-white to-blue-400 animate-pulse"></div>
    </div>
);

const MultipleChoiceQuestion = ({ question, answerState, onOptionSelect }: any) => {
  const { isAnswered, selectedOption } = answerState || { isAnswered: false };
  
  const getOptionClass = (optionId: string) => {
    if (!isAnswered) {
      return 'hover:bg-muted/80 hover:border-primary/50 cursor-pointer';
    }
    const isCorrect = optionId === question.correctAnswer;
    const isSelected = optionId === selectedOption;

    if (isCorrect) return 'border-green-500 bg-green-500/10 text-green-300';
    if (isSelected && !isCorrect) return 'border-red-500 bg-red-500/10 text-red-300';
    if (isSelected && isCorrect) return 'border-green-500 bg-green-500/10 text-green-300';

    return 'opacity-50';
  };

  // Ensure question.options is an array before mapping
  const options = Array.isArray(question.options) ? question.options : [];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {options.map((option: any) => (
          <Card
            key={option.id}
            className={cn(
              "transition-all duration-300 border-2 border-transparent",
              getOptionClass(option.id)
            )}
            onClick={() => !isAnswered && onOptionSelect(option.id)}
          >
            <CardContent className="p-3 sm:p-4 flex items-center gap-4">
              <div className={cn(
                "h-8 w-8 rounded-md flex items-center justify-center font-bold text-sm shrink-0",
                "bg-muted text-muted-foreground",
                selectedOption === option.id && 'bg-primary text-primary-foreground'
              )}>
                {option.id}
              </div>
              <div className="prose prose-invert prose-sm md:prose-base prose-p:my-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{option.text}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

const OpenAnswerQuestion = ({ onAnswerSubmit, isAnswered, isLoading, userAnswer, onUserAnswerChange, feedback }: any) => {
    return (
        <div className="flex flex-col gap-4 mb-6">
             {feedback && (
                <Alert variant="default" className="bg-primary/10 border-primary/20">
                    <div className="flex items-start gap-3">
                        <TutorAvatar className="h-8 w-8" />
                        <div className="flex-1 pt-1">
                            <AlertDescription className="text-primary/80 prose prose-sm prose-invert">
                                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {`**Koli:** ${feedback}`}
                                </ReactMarkdown>
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            )}
            <Textarea 
                placeholder="Escribe tu respuesta aquí..."
                className="min-h-[150px] bg-card/70 border-primary/20 text-base"
                disabled={isAnswered || isLoading}
                value={userAnswer}
                onChange={(e) => onUserAnswerChange(e.target.value)}
            />
            {!isAnswered && (
                <>
                    <div className="flex justify-end">
                        <Button onClick={onAnswerSubmit} disabled={isLoading}>
                          {isLoading && <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2"></span>}
                          {isLoading ? 'Evaluando...' : 'Enviar Respuesta'}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

type QuickChatMessage = {
  role: 'user' | 'model';
  content: string;
};

const KoliAssistancePopover = ({ currentQuestion, correctAnswer, onShowAnswer, onRephrase, onConvertToMultipleChoice, isAnswered, onHintRequest, onExplanationRequest }: any) => {
    const router = useRouter();
    const { user, decrementEnergy, setTutorSession } = useUser();
    
    const HINT_COST = 1;
    const REPHRASE_COST = 1;
    const CONVERT_COST = 2;
    const SHOW_ANSWER_COST = 5;
    const TUTOR_AI_COST = 3;
    const EXPLAIN_COST = 2;

    const hasEnoughEnergy = (cost: number) => user && user.energy >= cost;

    const [activeView, setActiveView] = useState<'main' | 'hint' | 'explanation'>('main');
    const [hintText, setHintText] = useState('');
    const [explanationText, setExplanationText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [showQuickQuestionInput, setShowQuickQuestionInput] = useState(false);
    const [quickChatHistory, setQuickChatHistory] = useState<QuickChatMessage[]>([]);
    const [quickQuestionCount, setQuickQuestionCount] = useState(0);
    const [quickQuestionText, setQuickQuestionText] = useState('');

    const handleActionWithEnergyCheck = (action: (...args: any[]) => void, cost: number, ...args: any[]) => {
        if (user && !hasEnoughEnergy(cost)) return; // Only block if user exists and has no energy
        if (user) decrementEnergy(cost); // Only decrement if user exists
        action(...args);
    }

    const handleHintClick = async () => {
        setActiveView('hint');
        setIsLoading(true);
        setHintText('');
        onHintRequest(); // Notify parent component

        const prompt = `Proporciona una pista corta y concisa para la siguiente pregunta. No des la respuesta directamente. Pregunta: "${currentQuestion.question}" ${currentQuestion.code || ''}`;
        
        const result = await handleTutorChat(prompt, []);
        if (result.response) {
            setHintText(result.response);
        } else {
            setHintText(result.error || 'Lo siento, no pude obtener una pista para ti.');
        }
        setIsLoading(false);
    };

    const handleShowAnswerAndExplainClick = async () => {
        onShowAnswer();
        setActiveView('explanation');
        setIsLoading(true);
        setExplanationText('');
        setShowQuickQuestionInput(false);
        setQuickChatHistory([]);
        setQuickQuestionCount(0);
        onExplanationRequest(); // Notify parent component

        const prompt = `Explica de forma muy breve y concisa por qué la respuesta a esta pregunta es correcta. Pregunta: "${currentQuestion.question} ${currentQuestion.code || ''}". Respuesta Correcta: "${correctAnswer}". Ve directo al punto.`;

        const result = await handleTutorChat(prompt, []);
        if (result.response) {
            setExplanationText(result.response);
        } else {
            setExplanationText(result.error || 'Lo siento, no pude obtener una explicación para ti.');
        }
        setIsLoading(false);
    };
    
    const handleRephraseClick = async () => {
        setIsLoading(true);
        const prompt = `Reformula la siguiente pregunta para que sea más fácil de entender o esté mejor ejemplificada. Devuelve solo el texto de la nueva pregunta. Pregunta original: "${currentQuestion.question} ${currentQuestion.code || ''}"`;
        const result = await handleTutorChat(prompt, []);
        setIsLoading(false);

        if (result.response) {
            onRephrase(result.response);
            setIsSuccess(true);
            setTimeout(() => {
                setIsPopoverOpen(false);
            }, 1000);
        }
    };
    
    const handleExplainClick = async () => {
        setActiveView('explanation');
        setIsLoading(true);
        setExplanationText('');
        setShowQuickQuestionInput(false);
        setQuickChatHistory([]);
        setQuickQuestionCount(0);
        onExplanationRequest(); // Notify parent component

        const prompt = `Explica de forma breve y concisa el concepto detrás de esta pregunta. Pregunta: "${currentQuestion.question} ${currentQuestion.code || ''}". La respuesta correcta es "${correctAnswer}". Ve directo al punto.`;

        const result = await handleTutorChat(prompt, []);
        if (result.response) {
            setExplanationText(result.response);
        } else {
            setExplanationText(result.error || 'Lo siento, no pude obtener una explicación para ti.');
        }
        setIsLoading(false);
    };

    const handleConvertToMultipleChoiceClick = async () => {
        setIsLoading(true);
        const result = await handleGenerateOptionsForQuestion({
            question: currentQuestion.question,
            correctAnswer: currentQuestion.answer
        });
        setIsLoading(false);
        if (result.options) {
            onConvertToMultipleChoice(result.options, currentQuestion.answer);
            setIsPopoverOpen(false);
        }
    };

    const handleQuickQuestionSubmit = async () => {
        if (!quickQuestionText.trim()) return;

        const userMessage: QuickChatMessage = { role: 'user', content: quickQuestionText };
        
        const newHistory = [...quickChatHistory, userMessage];
        setQuickChatHistory(newHistory);
setShowQuickQuestionInput(false);
        setIsLoading(true);

        const prompt = `Dentro del contexto de la pregunta "${currentQuestion.question}" (cuya respuesta es "${correctAnswer}"), responde a la siguiente duda del usuario de forma concisa: "${quickQuestionText}"`;
        
        const result = await handleTutorChat(prompt, []);
        const aiResponse = result.response || result.error || 'Lo siento, no pude responder a tu pregunta.';
        const aiMessage: QuickChatMessage = { role: 'model', content: aiResponse };

        setQuickChatHistory(prev => [...prev, aiMessage]);
        setQuickQuestionCount(prev => prev + 1);
        setQuickQuestionText('');
        setIsLoading(false);
    };

    const handleDeepen = () => {
        if (!user) {
            router.push('/login?reason=tutor_access');
            return;
        }
        setTutorSession({ exchangesLeft: 10, isActive: true });
        const contextMessage = `Hola Koli, estoy en una sesión de estudio. La pregunta era: "${currentQuestion.question}". ${isAnswered ? `La respuesta correcta es "${correctAnswer}".` : ''} ¿Podemos profundizar en este tema?`;
        const encodedContext = encodeURIComponent(contextMessage);
        router.push(`/tutor?context=${encodedContext}`);
    };

    const resetView = () => {
        setActiveView('main');
        setHintText('');
        setExplanationText('');
        setIsSuccess(false);
        setShowQuickQuestionInput(false);
        setQuickChatHistory([]);
        setQuickQuestionCount(0);
        setQuickQuestionText('');
    };

    const onOpenChange = (open: boolean) => {
        setIsPopoverOpen(open);
        if (!open) {
            setTimeout(resetView, 150);
        }
    };

    const CostIndicator = ({ cost, isGuest }: { cost: number, isGuest?: boolean }) => (
      <span className="ml-auto text-xs text-primary/80 font-mono flex items-center gap-1">
          { isGuest ? "Gratis" : `- ${cost}` } 
          { !isGuest && <Zap className="h-3 w-3" /> }
      </span>
    );
    
    const renderContent = () => {
        const isGuest = !user;

        if (isLoading && activeView === 'main') {
             return (
                 <div className="flex items-center gap-2 text-muted-foreground h-36 justify-center">
                    <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-300"></span>
                    Koli está pensando...
                </div>
            )
        }
        
        if (isSuccess) {
            return (
                <div className="flex flex-col items-center justify-center text-center h-36">
                    <CheckCircle className="h-10 w-10 text-green-500 mb-2 animate-in fade-in zoom-in-50" />
                    <p className="font-medium">¡Listo!</p>
                </div>
            );
        }

        if (activeView === 'hint') {
            return (
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium leading-none flex items-center gap-2">
                            <TutorAvatar />
                            Pista de Koli
                        </h4>
                        <Button variant="ghost" size="sm" onClick={resetView}>Volver</Button>
                    </div>
                    <div className="text-sm text-muted-foreground prose prose-sm prose-invert max-w-none">
                       {isLoading ? (
                           <div className="flex items-center gap-2 text-muted-foreground justify-center py-4">
                               <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-0"></span>
                               <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-150"></span>
                               <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-300"></span>
                           </div>
                       ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{hintText}</ReactMarkdown>
                       )}
                    </div>
                </div>
            )
        }

        if (activeView === 'explanation') {
            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium leading-none flex items-center gap-2">
                            <TutorAvatar />
                            Explicación
                        </h4>
                        <Button variant="ghost" size="sm" onClick={resetView}>Volver</Button>
                    </div>
                    <div className="text-sm text-muted-foreground prose prose-sm prose-invert max-w-none">
                       {isLoading && !explanationText ? (
                           <div className="flex items-center gap-2 text-muted-foreground justify-center py-4">
                               <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-0"></span>
                               <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-150"></span>
                               <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-300"></span>
                           </div>
                       ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanationText}</ReactMarkdown>
                       )}
                    </div>

                    <div className="border-t border-primary/20 pt-4 mt-4 space-y-2">
                      <div className="space-y-3 text-xs">
                          {quickChatHistory.map((msg, index) => (
                              <div key={index} className={cn("flex items-start gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                  {msg.role === 'model' && <TutorAvatar />}
                                  <div className={cn("max-w-[85%] p-2 rounded-lg", msg.role === 'user' ? 'bg-primary/20' : 'bg-muted')}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert prose-xs max-w-none prose-p:my-0">{msg.content}</ReactMarkdown>
                                  </div>
                              </div>
                          ))}
                           {isLoading && quickChatHistory.length % 2 !== 0 && (
                                <div className="flex items-start gap-2 justify-start">
                                    <TutorAvatar />
                                    <div className="p-2 rounded-lg bg-muted flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse delay-0"></span>
                                        <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse delay-150"></span>
                                        <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse delay-300"></span>
                                    </div>
                                </div>
                           )}
                      </div>

                      {showQuickQuestionInput ? (
                          <div className="space-y-2 pt-2">
                              <Textarea 
                                  placeholder="Haz una pregunta de seguimiento..."
                                  value={quickQuestionText}
                                  onChange={(e) => setQuickQuestionText(e.target.value)}
                                  className="text-xs"
                                  rows={2}
                              />
                              <Button size="sm" onClick={() => handleActionWithEnergyCheck(handleQuickQuestionSubmit, 0)} className="w-full" disabled={isLoading}>
                                  <SendHorizonal className="mr-2 h-4 w-4" /> Enviar
                              </Button>
                          </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 pt-2">
                          {quickQuestionCount < 2 &&
                            <Button variant="outline" size="sm" onClick={() => setShowQuickQuestionInput(true)} disabled={isLoading} className="justify-between w-full">
                                <span>Pregunta Rápida</span>
                                <span className="text-xs text-primary/80 font-mono">Gratis ({quickQuestionCount}/2)</span>
                            </Button>
                          }
                          <Button variant="outline" size="sm" onClick={() => handleActionWithEnergyCheck(handleDeepen, TUTOR_AI_COST)} className="justify-between w-full" disabled={isLoading || (user && !hasEnoughEnergy(TUTOR_AI_COST))}>
                              <span>Tutor AI</span>
                              <CostIndicator cost={TUTOR_AI_COST} isGuest={isGuest} />
                          </Button>
                        </div>
                      )}
                    </div>
                </div>
            );
        }

        // Default 'main' view
        return (
            <div className="grid gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Pedir ayuda a Koli</h4>
                    <p className="text-sm text-muted-foreground">
                        {isGuest ? 'Prueba estas herramientas gratis.' : 'Usa estas herramientas para ayudarte a aprender.'}
                    </p>
                </div>
                <div className="grid gap-2">
                  {!isAnswered ? (
                    <>
                      <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleHintClick, HINT_COST)} disabled={user && !hasEnoughEnergy(HINT_COST)}>
                        <Lightbulb className="mr-2 h-4 w-4" /> Pista <CostIndicator cost={HINT_COST} isGuest={isGuest} />
                      </Button>
                       {(currentQuestion.type === 'open-answer') && (
                        <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleConvertToMultipleChoiceClick, CONVERT_COST)} disabled={user && !hasEnoughEnergy(CONVERT_COST)}>
                          <MenuSquare className="mr-2 h-4 w-4" /> Convertir a Opción Múltiple <CostIndicator cost={CONVERT_COST} isGuest={isGuest} />
                        </Button>
                      )}
                      <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleRephraseClick, REPHRASE_COST)} disabled={user && !hasEnoughEnergy(REPHRASE_COST)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reformular <CostIndicator cost={REPHRASE_COST} isGuest={isGuest} />
                      </Button>
                       <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleShowAnswerAndExplainClick, SHOW_ANSWER_COST)} disabled={user && !hasEnoughEnergy(SHOW_ANSWER_COST)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Respuesta <CostIndicator cost={SHOW_ANSWER_COST} isGuest={isGuest} />
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleExplainClick, EXPLAIN_COST)} disabled={user && !hasEnoughEnergy(EXPLAIN_COST)}>
                      <Lightbulb className="mr-2 h-4 w-4" /> Explicar la Respuesta <CostIndicator cost={EXPLAIN_COST} isGuest={isGuest} />
                    </Button>
                  )}
                   <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleDeepen, TUTOR_AI_COST)} disabled={user && !hasEnoughEnergy(TUTOR_AI_COST)}>
                    <Bot className="mr-2 h-4 w-4" /> Tutor AI <CostIndicator cost={TUTOR_AI_COST} isGuest={isGuest} />
                   </Button>
                </div>
            </div>
        );
    };

    const popoverButton = (
        <Button
            variant="default"
            size="lg"
            className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg shadow-primary/30 p-0"
        >
            <TutorAvatar className="h-16 w-16" />
            <span className="sr-only">Pedir ayuda a Koli</span>
        </Button>
    );

    return (
        <Popover open={isPopoverOpen} onOpenChange={onOpenChange}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                             {popoverButton}
                        </PopoverTrigger>
                    </TooltipTrigger>
                    {user && user.energy === 0 && (
                        <TooltipContent side="top" align="end" className="mb-2 mr-2">
                            <p>No tienes suficiente energía.</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80 mb-2 mr-2" side="top" align="end">
                {renderContent()}
            </PopoverContent>
        </Popover>
    );
};

// Reducer logic
type State = {
    project: Project | null;
    srs: SpacedRepetitionSystem | null;
    currentCardId: string | null;
    isAnswered: boolean;
    userRating: UserRating | null;
    isLoading: boolean;
    isFinishing: boolean;
    isPulsing: boolean;
    sessionProgress: number;
    openAnswerText: string;
    openAnswerFeedback: string | null;
    openAnswerAttempts: number;
    masteryProgress: number;
    cognitiveCredits: number;
    bestStreak: number;
    currentStreak: number;
    isSessionFinished: boolean;
    finalSessionStats: { masteryProgress: number; cognitiveCredits: number; bestStreak: number; } | null;
    isGuestSession: boolean;
};

type Action =
    | { type: 'START_SESSION'; payload: { project: Project; isGuest: boolean; } }
    | { type: 'EVALUATE_ANSWER'; payload: { isCorrect: boolean; } }
    | { type: 'RATE_DIFFICULTY'; payload: { rating: UserRating } }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_FINISHING'; payload: boolean }
    | { type: 'SET_SESSION_FINISHED' }
    | { type: 'UPDATE_OPEN_ANSWER_TEXT'; payload: string }
    | { type: 'UPDATE_QUESTION_TEXT'; payload: string }
    | { type: 'SHOW_ANSWER' }
    | { type: 'SET_NEXT_QUESTION' };

const initialState: State = {
    project: null,
    srs: null,
    currentCardId: null,
    isAnswered: false,
    userRating: null,
    isLoading: true,
    isFinishing: false,
    isPulsing: false,
    sessionProgress: 0,
    openAnswerText: '',
    openAnswerFeedback: null,
    openAnswerAttempts: 0,
    masteryProgress: 0,
    cognitiveCredits: 0,
    bestStreak: 0,
    currentStreak: 0,
    isSessionFinished: false,
    finalSessionStats: null,
    isGuestSession: false,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'START_SESSION': {
            const { project, isGuest } = action.payload;

            const srs = new SpacedRepetitionSystem(project.flashcards || []);
            const nextCardId = srs.getNextCardId();

            return {
                ...initialState,
                project: project,
                srs,
                currentCardId: nextCardId,
                isLoading: false,
                isGuestSession: isGuest,
            };
        }
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_FINISHING':
            return { ...state, isFinishing: action.payload };

        case 'UPDATE_OPEN_ANSWER_TEXT':
            return { ...state, openAnswerText: action.payload, openAnswerFeedback: null };

        case 'EVALUATE_ANSWER': {
            // This action now only serves to show the answer and feedback,
            // the actual SRS update happens in RATE_DIFFICULTY.
            const { isCorrect } = action.payload;
            return { ...state, isAnswered: true, userRating: isCorrect ? 3 : 1, isLoading: false };
        }

        case 'SET_NEXT_QUESTION': {
            if (!state.srs) return state;
            const nextCardId = state.srs.getNextCardId();

            if (!nextCardId) {
                // Session is finished, logic to handle this will be added
                return { ...state, isSessionFinished: true };
            }

            const progress = state.srs.getSessionProgress();
            
            return {
                ...state,
                currentCardId: nextCardId,
                isAnswered: false,
                userRating: null,
                openAnswerText: '',
                openAnswerFeedback: null,
                sessionProgress: progress,
            };
        }

        case 'RATE_DIFFICULTY': {
            const { rating } = action.payload;
            const { srs, currentCardId } = state;
            if (!srs || !currentCardId) return state;

            srs.updateCard(currentCardId, rating);
            
            // This will be handled by SET_NEXT_QUESTION now
            return { ...state, isAnswered: true, userRating: rating };
        }
        
        case 'UPDATE_QUESTION_TEXT': {
             if (!state.project || !state.currentCardId) return state;
             const newFlashcards = state.project.flashcards?.map(q =>
                q.id === state.currentCardId ? { ...q, question: action.payload } : q
             );
             return { ...state, project: {...state.project, flashcards: newFlashcards}, isPulsing: true };
        }

        case 'SHOW_ANSWER': {
            if (!state.srs || !state.currentCardId) return state;
            const card = state.srs.getCard(state.currentCardId);
            if (!card) return state;
            return { ...state, isAnswered: true, openAnswerText: card.answer, userRating: 1 }; // Showing answer is equivalent to getting it wrong.
        }

        default:
            return state;
    }
}


function AprenderPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get('project');
  const sessionIndexParam = searchParams.get('session');
  
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user, addCoins, addDominionPoints, completeSessionForToday } = useUser();
  
  useEffect(() => {
    async function loadProject() {
      const projSlug = searchParams.get('project');
      const isGuest = projSlug === 'guest-project';

      let projectToLoad: Project | undefined | null = null;
      
      if (isGuest) {
        const guestProjectJson = localStorage.getItem('guestProject');
        if (guestProjectJson) {
            projectToLoad = JSON.parse(guestProjectJson);
        } else {
            router.push('/crear');
            return;
        }
      } else {
        if (!projSlug) {
            router.push('/');
            return;
        };
        const allProjects = await getAllProjects();
        projectToLoad = allProjects.find(p => p.slug === projSlug);
      }
      
      if (projectToLoad) {
        dispatch({ type: 'START_SESSION', payload: { project: projectToLoad, isGuest }});
      } else if (!isGuest) {
        router.push('/');
      }
    }
    loadProject();
  }, [projectSlug, router, searchParams]);
  
  useEffect(() => {
    if (state.isPulsing) {
      const timer = setTimeout(() => dispatch({ type: 'SET_LOADING', payload: false }), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.isPulsing]);

  const finishSessionAndRedirect = async () => {
    if (state.isGuestSession && state.project) {
        const updatedProject = {
            ...state.project,
            completedSessions: (state.project.completedSessions || 0) + 1,
        };
        localStorage.setItem('guestProject', JSON.stringify(updatedProject));
        router.push(`/mis-proyectos/${state.project.slug}?sessionCompleted=true`);
        return;
    }

    if (state.project && state.srs) {
        dispatch({ type: 'SET_FINISHING', payload: true });
        router.push(`/mis-proyectos/${projectSlug}`);
    }
  };


  const currentQuestion = useMemo(() => state.project?.flashcards?.find(q => q.id === state.currentCardId), [state.project, state.currentCardId]);
  
  if (state.isLoading || !state.project) {
      return (
        <div className="container mx-auto py-8">
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
      );
  }

  if (state.isSessionFinished) {
     return (
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] text-center">
            <Trophy className="h-20 w-20 text-yellow-400 mb-4" />
            <h1 className="text-4xl font-bold">¡Sesión Completada!</h1>
            <p className="text-muted-foreground mt-2 mb-8">¡Excelente trabajo! Has revisado todas las tarjetas para esta sesión.</p>
            <Button size="lg" onClick={finishSessionAndRedirect} disabled={state.isFinishing}>
                {state.isFinishing ? 'Guardando...' : 'Finalizar y Volver al Proyecto'}
            </Button>
        </div>
    );
  }
  
  if (state.isFinishing) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <h2 className="text-2xl font-bold mt-6">Finalizando sesión...</h2>
        <p className="text-muted-foreground">Koli está analizando tu rendimiento para adaptar tu plan.</p>
      </div>
    );
  }

  if (!currentQuestion) {
     return (
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <h2 className="text-2xl font-bold mt-6">Cargando siguiente pregunta...</h2>
        </div>
    );
  }
  
  const handleOpenAnswerSubmit = async () => {
    if (!state.openAnswerText.trim() || !currentQuestion) return;
    dispatch({ type: 'SET_LOADING', payload: true });

    const result = await handleEvaluateOpenAnswer({
        question: currentQuestion.question,
        correctAnswer: currentQuestion.answer,
        userAnswer: state.openAnswerText,
    });
    dispatch({ type: 'EVALUATE_ANSWER', payload: { isCorrect: result.evaluation.isCorrect }});
  };

  const handleDifficultyRating = (rating: UserRating) => {
      dispatch({ type: 'RATE_DIFFICULTY', payload: { rating } });
      // After rating, automatically move to the next question
      setTimeout(() => {
        dispatch({ type: 'SET_NEXT_QUESTION' });
      }, 500); // Add a small delay to show feedback
  };

  const handleShowAnswer = () => {
    dispatch({ type: 'SHOW_ANSWER' });
  };
  
  const handleRephrase = (newQuestionText: string) => {
      dispatch({ type: 'UPDATE_QUESTION_TEXT', payload: newQuestionText });
  };

  const isCorrect = state.userRating !== null && state.userRating > 1;

  return (
    <div className="container mx-auto py-4 sm:py-8">
      <div className="xl:grid xl:grid-cols-3 xl:gap-8">
        <div className="xl:col-span-2">
          <div className="mb-4">
            <Link href={state.isGuestSession ? `/mis-proyectos/guest-project` : `/mis-proyectos/${projectSlug}`} className="text-sm text-primary hover:underline hidden sm:flex items-center mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Salir de la sesión
            </Link>
          </div>
          
          <Card className="mb-3 sm:mb-6">
            <CardContent className="p-4 sm:p-6">
               <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-xl md:text-2xl font-bold">{state.project.title}</h1>
                  <p className="text-sm text-muted-foreground">{state.project.studyPlan?.plan[parseInt(sessionIndexParam || '0')]?.topic || 'Sesión de Repaso'}</p>
                </div>
                {/* Stats can be re-added here later if needed */}
              </div>

              <div>
                <Progress value={state.sessionProgress} />
              </div>
            </CardContent>
          </Card>

          <Card className={cn("mb-3 sm:mb-6 bg-card/70", state.isPulsing && "animate-pulse border-primary/50")}>
            <CardHeader className="flex flex-row justify-between items-center p-4 sm:p-6">
              <CardTitle className="text-lg md:text-xl">Pregunta</CardTitle>
              {state.isAnswered && (
                 <div className="flex items-center gap-4">
                    { isCorrect ? (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 sm:h-6 w-5 sm:w-6 text-green-500" />
                            <p className="font-bold text-base md:text-lg">¡Bien!</p>
                        </div>
                    ) : (
                         <div className="flex items-center gap-2">
                            <XCircle className="h-5 sm:h-6 w-5 sm:w-6 text-red-500" />
                            <p className="font-bold text-base md:text-lg">Respuesta incorrecta</p>
                        </div>
                    )}
                 </div>
              )}
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-p:my-2 prose-p:leading-relaxed prose-pre:bg-black/50 transition-opacity duration-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentQuestion.question}
                  </ReactMarkdown>
              </div>
            </CardContent>
            {state.isAnswered && (
                <CardFooter className="px-4 sm:px-6 py-4 bg-muted/30">
                     <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                         <p className="font-bold text-sm">Respuesta:</p>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {currentQuestion.answer}
                        </ReactMarkdown>
                    </div>
                </CardFooter>
            )}
          </Card>
          
          {!state.isAnswered ? (
             <Button onClick={() => dispatch({type: 'SHOW_ANSWER'})} className="w-full">
                Mostrar Respuesta
             </Button>
          ) : (
               <div className="flex justify-end items-center bg-card/70 border rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                      <Button variant="outline" size="sm" onClick={() => handleDifficultyRating(1)}>
                        <Frown className="mr-2 h-4 w-4" />
                        De Nuevo
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDifficultyRating(2)}>
                        <Meh className="mr-2 h-4 w-4" />
                        Difícil
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDifficultyRating(3)}>
                        <Smile className="mr-2 h-4 w-4" />
                        Bien
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDifficultyRating(4)}>
                        <Star className="mr-2 h-4 w-4" />
                        Fácil
                      </Button>
                  </div>
              </div>
          )}
        </div>

        <div className="hidden xl:block">
            {/* Placeholder for potential future side panel */}
        </div>
      </div>
    </div>
  );
}


export default function AprenderPage() {
    return (
        <Suspense>
            <AprenderPageComponent />
        </Suspense>
    );
}
