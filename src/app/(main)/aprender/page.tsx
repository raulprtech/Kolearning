

'use client';

import { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, TrendingUp, CheckCircle, XCircle, Lightbulb, Repeat, Frown, Meh, Smile, RefreshCw, Eye, Bot, Star, User2, Check, SendHorizonal, GripVertical, MenuSquare, Zap, Trophy } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAllProjects } from '@/app/actions/projects';
import type { Project, Flashcard } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

type SessionQuestion = Flashcard & { type: 'open-answer' | 'multiple-choice' | 'matching' | 'ordering' | 'fill-in-the-blank', options?: any[], code?: string, correctAnswerText?: string, textParts?: string[], pairs?: any[], items?: any[] };

type AnswerState = {
    [key: number]: {
        isAnswered: boolean;
        isCorrect?: boolean;
        selectedOption?: string;
        userAnswer?: string;
        openAnswerAttempts?: number;
    };
};

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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {question.options.map((option: any) => (
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

const FillInTheBlankQuestion = ({ question, isAnswered, onAnswerSubmit, userAnswer, onUserAnswerChange }: any) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAnswerSubmit(userAnswer);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="prose prose-invert prose-sm md:prose-base flex-grow">
                {question.textParts[0]}
                <Input 
                    type="text" 
                    className="inline-block w-48 mx-2 bg-card/70 border-primary/20"
                    value={userAnswer}
                    onChange={(e) => onUserAnswerChange(e.target.value)}
                    disabled={isAnswered}
                    autoFocus
                />
                {question.textParts[2]}
            </div>
            {!isAnswered && (
                <Button type="submit">
                    <Check className="mr-2 h-4 w-4" />
                    Comprobar
                </Button>
            )}
        </form>
    );
};

const MatchingQuestion = ({ question, isAnswered, onAnswerSubmit }: any) => {
    const { pairs } = question;
    const [shuffledTerms, setShuffledTerms] = useState<any[]>([]);
    const [shuffledDefs, setShuffledDefs] = useState<any[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<any>(null);
    const [selectedDef, setSelectedDef] = useState<any>(null);
    const [matchedPairs, setMatchedPairs] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);
        setShuffledTerms(shuffle(pairs));
        setShuffledDefs(shuffle(pairs.map((p: any) => ({ id: p.id, text: p.definition }))));
    }, [pairs]);

    useEffect(() => {
        if (selectedTerm && selectedDef) {
            if (selectedTerm.id === selectedDef.id) {
                // Correct match
                setMatchedPairs(prev => ({...prev, [selectedTerm.id]: selectedDef.id}));
            }
            // Reset selection after a short delay
            setTimeout(() => {
                setSelectedTerm(null);
                setSelectedDef(null);
            }, 500);
        }
    }, [selectedTerm, selectedDef]);

    useEffect(() => {
        if (!isAnswered && Object.keys(matchedPairs).length === pairs.length) {
            onAnswerSubmit(true);
        }
    }, [matchedPairs, pairs.length, onAnswerSubmit, isAnswered]);

    const getCardClass = (item: any, type: 'term' | 'def') => {
        const isSelected = (type === 'term' && selectedTerm?.id === item.id) || (type === 'def' && selectedDef?.id === item.id);
        const isMatched = (type === 'term' && matchedPairs[item.id]) || (type === 'def' && Object.values(matchedPairs).includes(item.id));
        
        if (isMatched) return 'border-green-500 bg-green-500/10 text-green-300 opacity-70';
        if (isSelected) return 'border-primary bg-primary/20';

        return 'hover:bg-muted/80 hover:border-primary/50 cursor-pointer';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
                {shuffledTerms.map((term: any) => (
                    <Card key={term.id} className={cn("transition-all", getCardClass(term, 'term'))} onClick={() => !isAnswered && !matchedPairs[term.id] && setSelectedTerm(term)}>
                        <CardContent className="p-4">{term.term}</CardContent>
                    </Card>
                ))}
            </div>
            <div className="space-y-4">
                 {shuffledDefs.map((def: any) => (
                    <Card key={def.id} className={cn("transition-all", getCardClass(def, 'def'))} onClick={() => !isAnswered && !Object.values(matchedPairs).includes(def.id) && setSelectedDef(def)}>
                        <CardContent className="p-4">{def.text}</CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};


const OrderingQuestion = ({ question, isAnswered, onAnswerSubmit }: any) => {
    const [items, setItems] = useState<any[]>([]);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        setItems([...question.items].sort(() => Math.random() - 0.5));
    }, [question.items]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const newItems = [...items];
            const draggedItemContent = newItems.splice(dragItem.current, 1)[0];
            newItems.splice(dragOverItem.current, 0, draggedItemContent);
            setItems(newItems);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const checkOrder = () => {
        const isCorrect = items.every((item, index) => item.id === (index + 1).toString());
        onAnswerSubmit(isCorrect);
    };

    return (
        <div className="mb-6">
            <div className="space-y-3 mb-6">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className={cn("flex items-center gap-4 p-4 rounded-lg bg-card/80 border cursor-grab", isAnswered && (items[index].id === (index + 1).toString() ? 'border-green-500' : 'border-red-500'))}
                        draggable={!isAnswered}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <GripVertical className="text-muted-foreground" />
                        <p>{item.text}</p>
                    </div>
                ))}
            </div>
            {!isAnswered && (
                <div className="flex justify-end">
                    <Button onClick={checkOrder}>Verificar Orden</Button>
                </div>
            )}
        </div>
    );
};


type QuickChatMessage = {
  role: 'user' | 'model';
  content: string;
};

const KoliAssistancePopover = ({ currentQuestion, correctAnswer, onShowAnswer, onRephrase, onConvertToMultipleChoice, isAnswered }: { currentQuestion: any, correctAnswer: string, onShowAnswer: () => void, onRephrase: (newQuestion: string) => void, onConvertToMultipleChoice: (options: any[]) => void, isAnswered: boolean }) => {
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
    const [quickQuestionText, setQuickQuestionText] = useState('');
    const [quickChatHistory, setQuickChatHistory] = useState<QuickChatMessage[]>([]);
    const [quickQuestionCount, setQuickQuestionCount] = useState(0);

    const handleActionWithEnergyCheck = (action: (...args: any[]) => void, cost: number, ...args: any[]) => {
        if (!hasEnoughEnergy(cost)) return;
        decrementEnergy(cost);
        action(...args);
    }

    const handleHintClick = async () => {
        setActiveView('hint');
        setIsLoading(true);
        setHintText('');

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
        } else {
            // Handle error, maybe show a toast
        }
    };
    
    const handleExplainClick = async () => {
        setActiveView('explanation');
        setIsLoading(true);
        setExplanationText('');
        setShowQuickQuestionInput(false);
        setQuickChatHistory([]);
        setQuickQuestionCount(0);

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
            onConvertToMultipleChoice(result.options);
            setIsPopoverOpen(false);
        } else {
            // handle error
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

    const CostIndicator = ({ cost }: { cost: number }) => (
      <span className="ml-auto text-xs text-primary/80 font-mono flex items-center gap-1">
          - {cost} <Zap className="h-3 w-3" />
      </span>
    );
    
    const renderContent = () => {
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
                          <Button variant="outline" size="sm" onClick={() => handleActionWithEnergyCheck(handleDeepen, TUTOR_AI_COST)} className="justify-between w-full" disabled={isLoading || !hasEnoughEnergy(TUTOR_AI_COST)}>
                              <span>Tutor AI</span>
                              <CostIndicator cost={TUTOR_AI_COST} />
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
                        Usa estas herramientas para ayudarte a aprender.
                    </p>
                </div>
                <div className="grid gap-2">
                  {!isAnswered ? (
                    <>
                      <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleHintClick, HINT_COST)} disabled={!hasEnoughEnergy(HINT_COST)}>
                        <Lightbulb className="mr-2 h-4 w-4" /> Pista <CostIndicator cost={HINT_COST} />
                      </Button>
                       {(currentQuestion.type === 'open-answer') && (
                        <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleConvertToMultipleChoiceClick, CONVERT_COST)} disabled={!hasEnoughEnergy(CONVERT_COST)}>
                          <MenuSquare className="mr-2 h-4 w-4" /> Convertir a Opción Múltiple <CostIndicator cost={CONVERT_COST} />
                        </Button>
                      )}
                      <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleRephraseClick, REPHRASE_COST)} disabled={!hasEnoughEnergy(REPHRASE_COST)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reformular <CostIndicator cost={REPHRASE_COST} />
                      </Button>
                       <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleShowAnswerAndExplainClick, SHOW_ANSWER_COST)} disabled={!hasEnoughEnergy(SHOW_ANSWER_COST)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Respuesta <CostIndicator cost={SHOW_ANSWER_COST} />
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleExplainClick, EXPLAIN_COST)} disabled={!hasEnoughEnergy(EXPLAIN_COST)}>
                      <Lightbulb className="mr-2 h-4 w-4" /> Explicar la Respuesta <CostIndicator cost={EXPLAIN_COST} />
                    </Button>
                  )}
                   <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleDeepen, TUTOR_AI_COST)} disabled={!hasEnoughEnergy(TUTOR_AI_COST)}>
                    <Bot className="mr-2 h-4 w-4" /> Tutor AI <CostIndicator cost={TUTOR_AI_COST} />
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


function AprenderPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get('project');
  const sessionIndex = searchParams.get('session');

  const [project, setProject] = useState<Project | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  
  // Session Stats
  const [masteryProgress, setMasteryProgress] = useState(0);
  const [cognitiveCredits, setCognitiveCredits] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Question-specific state
  const [isPulsing, setIsPulsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOpenAnswerText, setCurrentOpenAnswerText] = useState('');
  const [openAnswerFeedback, setOpenAnswerFeedback] = useState<string | null>(null);

  const { user } = useUser();
  const hasEnergy = user && user.energy > 0;
  
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  useEffect(() => {
    async function loadProject() {
      if (!projectSlug) return;
      const allProjects = await getAllProjects();
      const foundProject = allProjects.find(p => p.slug === projectSlug);
      if (foundProject) {
        setProject(foundProject);
        const questions: SessionQuestion[] = (foundProject.flashcards || []).map(fc => ({
          ...fc,
          type: 'open-answer', // Default to open-answer for now
        }));
        setSessionQuestions(questions);
      } else {
        router.push('/'); // Or a 404 page
      }
    }
    loadProject();
  }, [projectSlug, router]);


  const currentQuestion = useMemo(() => sessionQuestions[currentIndex], [sessionQuestions, currentIndex]);
  const currentAnswerState = useMemo(() => answers[currentIndex] || { isAnswered: false, openAnswerAttempts: 0 }, [answers, currentIndex]);
  const isCorrect = currentAnswerState.isCorrect;

  const sessionProgress = sessionQuestions.length > 0 ? ((currentIndex + 1) / sessionQuestions.length) * 100 : 0;
  
  const updateAnswer = (index: number, update: Partial<AnswerState[number]>) => {
    setAnswers(prev => ({
      ...prev,
      [index]: { ...(prev[index] || { isAnswered: false, openAnswerAttempts: 0 }), ...update }
    }));
  }

  const handleCorrectAnswer = (type: string) => {
    const newStreak = currentStreak + 1;
    setCurrentStreak(newStreak);
    if (newStreak > bestStreak) {
      setBestStreak(newStreak);
    }

    const pointsMap: { [key: string]: { mastery: number, credits: number } } = {
        'multiple-choice': { mastery: 10, credits: 5 },
        'open-answer': { mastery: 20, credits: 10 },
        'matching': { mastery: 15, credits: 8 },
        'ordering': { mastery: 15, credits: 8 },
        'fill-in-the-blank': { mastery: 10, credits: 5 },
    };

    const points = pointsMap[type] || { mastery: 0, credits: 0 };
    setMasteryProgress(prev => prev + points.mastery);
    setCognitiveCredits(prev => prev + points.credits);
  };

  const handleIncorrectAnswer = () => {
    setCurrentStreak(0);
  };

  const handleOptionSelect = (optionId: string) => {
    if (!hasEnergy) return; 
    const isAnswerCorrect = currentQuestion.type === 'multiple-choice' && optionId === (currentQuestion as any).correctAnswer;
    
    if (isAnswerCorrect) {
      handleCorrectAnswer('multiple-choice');
    } else {
      handleIncorrectAnswer();
    }
    
    updateAnswer(currentIndex, { selectedOption: optionId, isAnswered: true, isCorrect: isAnswerCorrect });
  };
  
  const handleGenericAnswer = (isCorrect: boolean, questionType: string) => {
      if (isCorrect) {
          handleCorrectAnswer(questionType);
      } else {
          handleIncorrectAnswer();
      }
      updateAnswer(currentIndex, { isAnswered: true, isCorrect });
  };


  const handleOpenAnswerTextChange = (text: string) => {
    setCurrentOpenAnswerText(text);
    if (openAnswerFeedback) {
        setOpenAnswerFeedback(null);
    }
  };

  const handleOpenAnswerSubmit = async () => {
    if (!currentOpenAnswerText.trim()) return;

    setIsLoading(true);
    setOpenAnswerFeedback(null);

    const attempts = currentAnswerState.openAnswerAttempts || 0;
    
    const result = await handleEvaluateOpenAnswer({
        question: currentQuestion.question,
        correctAnswer: currentQuestion.answer,
        userAnswer: currentOpenAnswerText,
    });

    if (result.evaluation?.isCorrect) {
        handleCorrectAnswer('open-answer');
        updateAnswer(currentIndex, { isAnswered: true, isCorrect: true, userAnswer: currentOpenAnswerText, openAnswerAttempts: attempts + 1 });
    } else {
        handleIncorrectAnswer();
        const nextAttempt = attempts + 1;
        if (nextAttempt >= 3) {
            updateAnswer(currentIndex, { isAnswered: true, isCorrect: false, userAnswer: currentOpenAnswerText, openAnswerAttempts: nextAttempt });
            setOpenAnswerFeedback(`La respuesta correcta es: ${currentQuestion.answer}`);
        } else {
            // Try again
            if (result.evaluation?.feedback) {
                setOpenAnswerFeedback(result.evaluation.feedback);
            }
            if (result.evaluation?.rephrasedQuestion) {
                setSessionQuestions(prevQuestions => {
                    const updatedQuestions = [...prevQuestions];
                    updatedQuestions[currentIndex].question = result.evaluation!.rephrasedQuestion!;
                    return updatedQuestions;
                });
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 1000);
            }
             updateAnswer(currentIndex, { openAnswerAttempts: nextAttempt, userAnswer: currentOpenAnswerText });
        }
    }
    
    setCurrentOpenAnswerText('');
    setIsLoading(false);
  };


  const handleShowAnswer = () => {
      if (currentQuestion.type === 'multiple-choice') {
          handleOptionSelect((currentQuestion as any).correctAnswer);
      } else if (currentQuestion.type === 'open-answer') {
          handleCorrectAnswer('open-answer');
          updateAnswer(currentIndex, { isAnswered: true, isCorrect: true, userAnswer: currentQuestion.answer });
          setCurrentOpenAnswerText(currentQuestion.answer);
      } else if (currentQuestion.type === 'fill-in-the-blank') {
          const correctAnswer = (currentQuestion as any).correctAnswer;
          handleCorrectAnswer('fill-in-the-blank');
          handleGenericAnswer(true, 'fill-in-the-blank');
          updateAnswer(currentIndex, { isAnswered: true, isCorrect: true, userAnswer: correctAnswer });
          setCurrentOpenAnswerText(correctAnswer);
      }
  };
  
  const handleRephrase = (newQuestionText: string) => {
      setSessionQuestions(prevQuestions => {
          const updatedQuestions = [...prevQuestions];
          updatedQuestions[currentIndex].question = newQuestionText;
          return updatedQuestions;
      });
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000); // Duration of the pulse animation
  };

  const handleConvertToMultipleChoice = (options: string[]) => {
      setSessionQuestions(prevQuestions => {
          const updatedQuestions = [...prevQuestions];
          const newQ = { ...updatedQuestions[currentIndex] };
          
          newQ.type = 'multiple-choice';
          (newQ as any).options = options.map((opt, i) => ({
              id: String.fromCharCode(65 + i),
              text: opt
          }));

          const correctOption = (newQ as any).options.find((o: any) => o.text === newQ.answer);
          if (correctOption) {
            (newQ as any).correctAnswer = correctOption.id;
          } else {
            // Fallback if correct answer not in options, make first one correct
            (newQ as any).correctAnswer = 'A';
          }
          
          updatedQuestions[currentIndex] = newQ;
          return updatedQuestions;
      });
  };

  const goToNext = () => {
      if (currentIndex < sessionQuestions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setOpenAnswerFeedback(null);
          setCurrentOpenAnswerText('');
      } else {
          setIsSessionFinished(true);
      }
  };
  
  if (!project || sessionQuestions.length === 0) {
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
  
  if (isSessionFinished) {
      return (
          <div className="container mx-auto py-8 flex items-center justify-center min-h-[calc(100vh-120px)]">
              <Card className="w-full max-w-lg text-center shadow-2xl shadow-primary/10">
                  <CardHeader>
                      <Trophy className="mx-auto h-16 w-16 text-yellow-400" />
                      <CardTitle className="text-3xl mt-4">¡Sesión Completada!</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <p className="text-muted-foreground">¡Felicidades! Has completado la sesión de estudio. Aquí está tu resumen:</p>
                      <div className="grid grid-cols-3 gap-4 text-center">
                           <div>
                                <p className="text-3xl font-bold">+{masteryProgress}</p>
                                <p className="text-sm text-muted-foreground">Puntos de Dominio</p>
                           </div>
                           <div>
                                <p className="text-3xl font-bold">{currentStreak}</p>
                                <p className="text-sm text-muted-foreground">Racha</p>
                           </div>
                           <div>
                                <p className="text-3xl font-bold">+{cognitiveCredits}</p>
                                <p className="text-sm text-muted-foreground">Créditos Cognitivos</p>
                           </div>
                      </div>
                  </CardContent>
                  <CardFooter>
                      <Button size="lg" className="w-full" asChild>
                          <Link href={`/mis-proyectos/${project.slug}?mastery=${masteryProgress}&credits=${cognitiveCredits}&session=${sessionIndex}`}>
                              Continuar
                          </Link>
                      </Button>
                  </CardFooter>
              </Card>
          </div>
      )
  }

  return (
    <div className="container mx-auto py-4 sm:py-8">
      <div className="xl:grid xl:grid-cols-3 xl:gap-8">

        {/* Main Content Column */}
        <div className="xl:col-span-2">
          <div className="mb-4">
            <Link href={`/mis-proyectos/${projectSlug}`} className="text-sm text-primary hover:underline hidden sm:flex items-center mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Salir de la sesión
            </Link>
          </div>
          
          <Card className="mb-3 sm:mb-6">
            <CardContent className="p-4 sm:p-6">
               <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-xl md:text-2xl font-bold">{project.title}</h1>
                  <p className="text-sm text-muted-foreground">{project.studyPlan?.plan[parseInt(sessionIndex || '0')]?.topic || 'Sesión de Repaso'}</p>
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <div className="flex items-center gap-2">
                      {'🪙'}
                      <div>
                        <p className="font-bold text-base md:text-lg">{cognitiveCredits}</p>
                        <p className="text-xs text-muted-foreground">Creditos Cognitivos</p>
                      </div>
                    </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="font-bold text-base md:text-lg">+{masteryProgress}</p>
                      <p className="text-xs text-muted-foreground">Puntos de Dominio</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                     <div>
                      <p className="font-bold text-base md:text-lg">{bestStreak}</p>
                      <p className="text-xs text-muted-foreground">Mejor Racha</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Progress value={sessionProgress} />
              </div>
            </CardContent>
          </Card>

          <Card className={cn("mb-3 sm:mb-6 bg-card/70", isPulsing && "animate-pulse border-primary/50")}>
            <CardHeader className="flex flex-row justify-between items-center p-4 sm:p-6">
              <CardTitle className="text-lg md:text-xl">Pregunta {currentQuestion.type === 'open-answer' && !currentAnswerState.isAnswered && currentAnswerState.openAnswerAttempts > 0 ? `(Intento ${currentAnswerState.openAnswerAttempts + 1})` : ''}</CardTitle>
              {currentAnswerState.isAnswered && (
                 <div className="flex items-center gap-4">
                    { isCorrect ? (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 sm:h-6 w-5 sm:w-6 text-green-500" />
                            <p className="font-bold text-base md:text-lg">¡Correcto!</p>
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
                  {currentQuestion.type === 'multiple-choice' && currentQuestion.code && (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {currentQuestion.code}
                      </ReactMarkdown>
                  )}
              </div>
            </CardContent>
          </Card>
          
          {currentQuestion.type === 'multiple-choice' && (
            <MultipleChoiceQuestion 
              question={currentQuestion}
              answerState={currentAnswerState}
              onOptionSelect={handleOptionSelect}
            />
          )}

          {currentQuestion.type === 'open-answer' && (
            <OpenAnswerQuestion 
              onAnswerSubmit={handleOpenAnswerSubmit}
              isAnswered={currentAnswerState.isAnswered}
              isLoading={isLoading}
              userAnswer={currentAnswerState.isAnswered ? (currentAnswerState.userAnswer || '') : currentOpenAnswerText}
              onUserAnswerChange={handleOpenAnswerTextChange}
              feedback={openAnswerFeedback}
            />
          )}

          {currentQuestion.type === 'fill-in-the-blank' && (
              <FillInTheBlankQuestion 
                  question={currentQuestion}
                  isAnswered={currentAnswerState.isAnswered}
                  userAnswer={currentAnswerState.isAnswered ? ((currentAnswerState.userAnswer || (currentQuestion as any).correctAnswer)) : currentOpenAnswerText}
                  onUserAnswerChange={setCurrentOpenAnswerText}
                  onAnswerSubmit={() => {
                      const isCorrect = currentOpenAnswerText.trim().toLowerCase() === (currentQuestion as any).correctAnswer.toLowerCase();
                      handleGenericAnswer(isCorrect, 'fill-in-the-blank');
                      updateAnswer(currentIndex, { userAnswer: currentOpenAnswerText });
                      if (!isCorrect) {
                        setCurrentOpenAnswerText('');
                      }
                  }}
              />
          )}

          {currentQuestion.type === 'matching' && (
              <MatchingQuestion
                  question={currentQuestion}
                  isAnswered={currentAnswerState.isAnswered}
                  onAnswerSubmit={(isCorrect: boolean) => handleGenericAnswer(isCorrect, 'matching')}
              />
          )}

          {currentQuestion.type === 'ordering' && (
              <OrderingQuestion
                  question={currentQuestion}
                  isAnswered={currentAnswerState.isAnswered}
                  onAnswerSubmit={(isCorrect: boolean) => handleGenericAnswer(isCorrect, 'ordering')}
              />
          )}
          
          {currentAnswerState.isAnswered && (
               <div className="flex justify-end items-center bg-card/70 border rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                      <Button variant="outline" size="sm" onClick={goToNext}>
                        <Frown className="mr-2 h-4 w-4" />
                        Muy Difícil
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToNext}>
                        <Frown className="mr-2 h-4 w-4" />
                        Difícil
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToNext}>
                        <Meh className="mr-2 h-4 w-4" />
                        Bien
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToNext}>
                        <Smile className="mr-2 h-4 w-4" />
                        Fácil
                      </Button>
                  </div>
              </div>
          )}
        </div>

        {/* Help Column is not used with the Popover approach */}
        <div className="hidden xl:block">
            {/* Placeholder for potential future side panel */}
        </div>
      </div>

       <div className="xl:hidden-for-now">
         <KoliAssistancePopover 
            currentQuestion={currentQuestion} 
            correctAnswer={currentQuestion.answer || ''}
            onShowAnswer={handleShowAnswer}
            onRephrase={handleRephrase}
            onConvertToMultipleChoice={handleConvertToMultipleChoice}
            isAnswered={currentAnswerState.isAnswered}
          />
       </div>

    </div>
  );
}


export default function AprenderPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AprenderPageComponent />
        </Suspense>
    );
}
