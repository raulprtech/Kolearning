

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, TrendingUp, CheckCircle, XCircle, Lightbulb, Repeat, Frown, Meh, Smile, RefreshCw, Eye, Bot, Star, User2, Check, SendHorizonal, GripVertical, MenuSquare, Zap } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { handleEvaluateOpenAnswer, handleGenerateOptionsForQuestion } from '@/app/actions/decks';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialSessionQuestions = [
  {
    type: 'multiple-choice',
    question: '¿Cuál es el resultado del siguiente código?',
    code: '```javascript\nconsole.log(typeof null);\n```',
    options: [
      { id: 'A', text: '`null`' },
      { id: 'B', text: '`undefined`' },
      { id: 'C', text: '`object`' },
      { id: 'D', text: '`string`' },
    ],
    correctAnswer: 'C',
    correctAnswerText: '`object`',
  },
  {
    type: 'open-answer',
    question: 'Explica la diferencia entre `let`, `const`, y `var` en JavaScript.',
    correctAnswerText: '`var` tiene alcance de función, mientras que `let` y `const` tienen alcance de bloque. `const` no puede ser reasignada, a diferencia de `let` y `var`.',
  },
  {
    type: 'matching',
    question: 'Asocia cada hook de React con su propósito principal.',
    pairs: [
        { id: 'A', term: '`useState`', definition: 'Gestionar el estado local en un componente.' },
        { id: 'B', term: '`useEffect`', definition: 'Realizar efectos secundarios (como peticiones de datos) después del renderizado.' },
        { id: 'C', term: '`useContext`', definition: 'Consumir un valor de un Context de React.' },
    ],
    correctAnswerText: 'useState -> Gestionar estado, useEffect -> Realizar efectos secundarios, useContext -> Consumir contexto',
  },
  {
    type: 'ordering',
    question: 'Ordena los pasos para hacer un componente "Hello, World" en React.',
    items: [
        { id: '1', text: 'Importar React.' },
        { id: '2', text: 'Definir el componente de función.' },
        { id: '3', text: 'Retornar el JSX `<h1>Hello, World</h1>`.' },
        { id: '4', text: 'Exportar el componente.' },
    ],
    correctAnswerText: 'Importar -> Definir -> Retornar -> Exportar',
  },
  {
    type: 'fill-in-the-blank',
    question: 'Completa la frase: En React, las props son ________.',
    textParts: ['En React, las props son ', 'inmutables', '.'],
    correctAnswer: 'inmutables',
    correctAnswerText: 'En React, las props son inmutables.',
  },
  {
    type: 'multiple-choice',
    question: '¿Cuál de estos NO es un tipo de dato primitivo en JavaScript?',
    options: [
        { id: 'A', text: '`string`' },
        { id: 'B', text: '`number`' },
        { id: 'C', text: '`array`' },
        { id: 'D', text: '`boolean`' },
    ],
    correctAnswer: 'C',
    correctAnswerText: '`array` (es un tipo de objeto)',
  },
   {
    type: 'open-answer',
    question: '¿Qué es un closure en JavaScript? Proporciona un ejemplo de código sencillo.',
    correctAnswerText: 'Un closure es una función que recuerda el entorno en el que fue creada. Ejemplo:\n```javascript\nfunction exterior() {\n  let a = 1;\n  function interior() {\n    console.log(a);\n  }\n  return interior;\n}\nconst miClosure = exterior();\nmiClosure(); // Imprime 1\n```',
  },
];

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

const OpenAnswerQuestion = ({ onAnswerSubmit, isAnswered, isLoading, userAnswer, onUserAnswerChange, feedback, revealedAnswer }: any) => {
    return (
        <div className="flex flex-col gap-4 mb-6">
             {feedback && !revealedAnswer && (
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
            {revealedAnswer && (
                 <Alert variant="default" className="bg-green-500/10 border-green-500/20">
                    <div className="flex items-start gap-3">
                        <TutorAvatar className="h-8 w-8" />
                        <div className="flex-1 pt-1">
                            <AlertDescription className="text-green-300/90 prose prose-sm prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {`**Respuesta correcta:** ${revealedAnswer}`}
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
  sender: 'user' | 'ai';
  text: string;
};

const KoliAssistancePopover = ({ currentQuestion, correctAnswer, onShowAnswer, onRephrase, onConvertToMultipleChoice, isAnswered }: { currentQuestion: any, correctAnswer: string, onShowAnswer: () => void, onRephrase: (newQuestion: string) => void, onConvertToMultipleChoice: (options: any[]) => void, isAnswered: boolean }) => {
    const router = useRouter();
    const { user, decrementEnergy, setTutorSession } = useUser();
    
    const HINT_COST = 1;
    const REPHRASE_COST = 1;
    const CONVERT_COST = 2;
    const SHOW_ANSWER_COST = 5;
    const TUTOR_AI_COST = 3;

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
        
        const result = await handleTutorChat(prompt);
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

        const result = await handleTutorChat(prompt);
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
        const result = await handleTutorChat(prompt);
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

        const result = await handleTutorChat(prompt);
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
            correctAnswer: currentQuestion.correctAnswerText || currentQuestion.correctAnswer
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

        const userMessage: QuickChatMessage = { sender: 'user', text: quickQuestionText };
        setQuickChatHistory(prev => [...prev, userMessage]);
        setShowQuickQuestionInput(false);
        setIsLoading(true);

        const prompt = `Dentro del contexto de la pregunta "${currentQuestion.question}" (cuya respuesta es "${correctAnswer}"), responde a la siguiente duda del usuario de forma concisa: "${quickQuestionText}"`;
        
        const result = await handleTutorChat(prompt);
        const aiResponse = result.response || result.error || 'Lo siento, no pude responder a tu pregunta.';
        const aiMessage: QuickChatMessage = { sender: 'ai', text: aiResponse };

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
                              <div key={index} className={cn("flex items-start gap-2", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                                  {msg.sender === 'ai' && <TutorAvatar />}
                                  <div className={cn("max-w-[85%] p-2 rounded-lg", msg.sender === 'user' ? 'bg-primary/20' : 'bg-muted')}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert prose-xs max-w-none prose-p:my-0">{msg.text}</ReactMarkdown>
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
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            {quickQuestionCount < 2 &&
                              <Button variant="outline" size="sm" onClick={() => setShowQuickQuestionInput(true)} disabled={isLoading}>Pregunta Rápida</Button>
                            }
                            <Button variant="outline" size="sm" onClick={() => handleActionWithEnergyCheck(handleDeepen, TUTOR_AI_COST)} className={cn(quickQuestionCount >= 2 && "col-span-2")} disabled={isLoading || !hasEnoughEnergy(TUTOR_AI_COST)}>Tutor AI</Button>
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
                       {(currentQuestion.type === 'open-answer' || currentQuestion.type === 'fill-in-the-blank') && (
                        <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleConvertToMultipleChoiceClick, CONVERT_COST)} disabled={!hasEnoughEnergy(CONVERT_COST)}>
                          <MenuSquare className="mr-2 h-4 w-4" /> Convertir a Opción Múltiple <CostIndicator cost={CONVERT_COST} />
                        </Button>
                      )}
                      <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleShowAnswerAndExplainClick, SHOW_ANSWER_COST)} disabled={!hasEnoughEnergy(SHOW_ANSWER_COST)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Respuesta <CostIndicator cost={SHOW_ANSWER_COST} />
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleRephraseClick, REPHRASE_COST)} disabled={!hasEnoughEnergy(REPHRASE_COST)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reformular <CostIndicator cost={REPHRASE_COST} />
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" className="justify-start" onClick={() => handleActionWithEnergyCheck(handleExplainClick, HINT_COST)} disabled={!hasEnoughEnergy(HINT_COST)}>
                      <Lightbulb className="mr-2 h-4 w-4" /> Explicar la Respuesta <CostIndicator cost={HINT_COST} />
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


export default function AprenderPage() {
  const [sessionQuestions, setSessionQuestions] = useState(initialSessionQuestions);
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
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);

  const { user } = useUser();
  const hasEnergy = user && user.energy > 0;

  const currentQuestion = useMemo(() => sessionQuestions[currentIndex], [sessionQuestions, currentIndex]);
  const currentAnswerState = useMemo(() => answers[currentIndex] || { isAnswered: false, openAnswerAttempts: 0 }, [answers, currentIndex]);
  const isCorrect = currentAnswerState.isCorrect;

  const sessionProgress = ((currentIndex + 1) / sessionQuestions.length) * 100;
  
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
    if (!hasEnergy) return; // Although button is disabled, good to double check
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
        correctAnswer: currentQuestion.correctAnswerText,
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
            setRevealedAnswer(currentQuestion.correctAnswerText);
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
          updateAnswer(currentIndex, { isAnswered: true, isCorrect: true, userAnswer: currentQuestion.correctAnswerText });
          setCurrentOpenAnswerText(currentQuestion.correctAnswerText);
          setRevealedAnswer(null); // Clear revealed answer since it's now in the textarea
      } else if (currentQuestion.type === 'fill-in-the-blank') {
          const correctAnswer = (currentQuestion as any).correctAnswer;
          handleCorrectAnswer('fill-in-the-blank');
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

          const correctOption = (newQ as any).options.find((o: any) => o.text === (newQ.correctAnswerText || newQ.correctAnswer));
          (newQ as any).correctAnswer = correctOption.id;

          updatedQuestions[currentIndex] = newQ;
          return updatedQuestions;
      });
  };

  const goToNext = () => {
      if (currentIndex < sessionQuestions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setOpenAnswerFeedback(null);
          setCurrentOpenAnswerText('');
          setRevealedAnswer(null);
      }
  };

  const showAttemptCounter = currentAnswerState.openAnswerAttempts > 0 && !currentAnswerState.isCorrect && currentQuestion.type === 'open-answer';

  return (
    <div className="container mx-auto py-4 sm:py-8">
      <div className="xl:grid xl:grid-cols-3 xl:gap-8">

        {/* Main Content Column */}
        <div className="xl:col-span-2">
          <div className="mb-4">
            <Link href="/" className="text-sm text-primary hover:underline hidden sm:flex items-center mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Salir de la sesión
            </Link>
          </div>
          
          <Card className="mb-3 sm:mb-6">
            <CardContent className="p-4 sm:p-6">
               <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-xl md:text-2xl font-bold">Fundamentos de JavaScript</h1>
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
                  {currentQuestion.type === 'multiple-choice' && 'code' in currentQuestion && (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {(currentQuestion as any).code}
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
              revealedAnswer={revealedAnswer}
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
            correctAnswer={currentQuestion.correctAnswerText || ''}
            onShowAnswer={handleShowAnswer}
            onRephrase={handleRephrase}
            onConvertToMultipleChoice={handleConvertToMultipleChoice}
            isAnswered={currentAnswerState.isAnswered}
          />
       </div>

    </div>
  );
}
