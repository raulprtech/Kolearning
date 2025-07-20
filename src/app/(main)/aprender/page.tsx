

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, TrendingUp, CheckCircle, XCircle, Lightbulb, Repeat, Frown, Meh, Smile, RefreshCw, Eye, Wand2, Star, User2, Check, SendHorizonal, Bot } from 'lucide-react';
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
import { handleEvaluateOpenAnswer } from '@/app/actions/decks';
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

const OpenAnswerQuestion = ({ onAnswerSubmit, isAnswered, isLoading, userAnswer, onUserAnswerChange, feedback }: any) => {
    return (
        <div className="flex flex-col gap-4 mb-6">
             {feedback && (
                <Alert variant="default" className="bg-primary/10 border-primary/20">
                    <div className="flex items-start gap-3">
                        <TutorAvatar className="h-8 w-8" />
                        <div className="flex-1">
                            <AlertTitle className="text-primary/90">Koli:</AlertTitle>
                            <AlertDescription className="text-primary/80 prose prose-sm prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
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
  sender: 'user' | 'ai';
  text: string;
};

const MagicHelpPopover = ({ currentQuestion, correctAnswer, onShowAnswer, onRephrase, isAnswered }: { currentQuestion: any, correctAnswer: string, onShowAnswer: () => void, onRephrase: (newQuestion: string) => void, isAnswered: boolean }) => {
    const router = useRouter();
    const { user, decrementEnergy } = useUser();
    const hasEnergy = user && user.energy > 0;

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

    const handleActionWithEnergyCheck = (action: (...args: any[]) => void, ...args: any[]) => {
        if (!hasEnergy) return;
        decrementEnergy();
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

        const prompt = `Explica de forma muy breve y concisa por qué la respuesta a esta pregunta es correcta. Pregunta: "${currentQuestion.question} ${currentQuestion.code || ''}". Respuesta Correcta: "${correctAnswer}".`;

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

        const prompt = `Explica de forma breve y concisa el concepto detrás de esta pregunta. Pregunta: "${currentQuestion.question} ${currentQuestion.code || ''}". La respuesta correcta es "${correctAnswer}".`;

        const result = await handleTutorChat(prompt);
        if (result.response) {
            setExplanationText(result.response);
        } else {
            setExplanationText(result.error || 'Lo siento, no pude obtener una explicación para ti.');
        }
        setIsLoading(false);
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
    
    const renderContent = () => {
        if (isLoading && activeView !== 'explanation') {
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
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{hintText}</ReactMarkdown>
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
                              <Button size="sm" onClick={() => handleActionWithEnergyCheck(handleQuickQuestionSubmit)} className="w-full" disabled={isLoading || !hasEnergy}>
                                  <SendHorizonal className="mr-2 h-4 w-4" /> Enviar
                              </Button>
                          </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            {quickQuestionCount < 2 &&
                              <Button variant="outline" size="sm" onClick={() => setShowQuickQuestionInput(true)} disabled={isLoading || !hasEnergy}>Pregunta Rápida</Button>
                            }
                            <Button variant="outline" size="sm" onClick={() => handleActionWithEnergyCheck(handleDeepen)} className={cn(quickQuestionCount >= 2 && "col-span-2")} disabled={isLoading || !hasEnergy}>Profundizar</Button>
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
                    <h4 className="font-medium leading-none">Ayuda Mágica</h4>
                    <p className="text-sm text-muted-foreground">
                        Usa estas herramientas para ayudarte a aprender.
                    </p>
                </div>
                <div className="grid gap-2">
                  {!isAnswered ? (
                    <>
                      <Button variant="outline" onClick={() => handleActionWithEnergyCheck(handleHintClick)} disabled={!hasEnergy}><Lightbulb className="mr-2 h-4 w-4" /> Pista</Button>
                      <Button variant="outline" onClick={() => handleActionWithEnergyCheck(handleShowAnswerAndExplainClick)} disabled={!hasEnergy}><Eye className="mr-2 h-4 w-4" /> Ver Respuesta</Button>
                      <Button variant="outline" onClick={() => handleActionWithEnergyCheck(handleRephraseClick)} disabled={!hasEnergy}><RefreshCw className="mr-2 h-4 w-4" /> Reformular</Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => handleActionWithEnergyCheck(handleExplainClick)} disabled={!hasEnergy}><Lightbulb className="mr-2 h-4 w-4" /> Explicar la Respuesta</Button>
                  )}
                   <Button variant="outline" onClick={() => handleActionWithEnergyCheck(handleDeepen)} disabled={!hasEnergy}><Bot className="mr-2 h-4 w-4" /> Tutor AI</Button>
                </div>
            </div>
        );
    };

    const popoverButton = (
        <Button
            variant="default"
            size="lg"
            className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg shadow-primary/30"
            disabled={!hasEnergy}
        >
            <Wand2 className="h-8 w-8" />
            <span className="sr-only">Ayuda Mágica</span>
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
                    {!hasEnergy && (
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
  const [masteryProgress, setMasteryProgress] = useState(10);
  const [bestStreak, setBestStreak] = useState(1);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOpenAnswerText, setCurrentOpenAnswerText] = useState('');
  const [openAnswerFeedback, setOpenAnswerFeedback] = useState<string | null>(null);

  const { user } = useUser();
  const hasEnergy = user && user.energy > 0;

  const currentQuestion = useMemo(() => sessionQuestions[currentIndex], [sessionQuestions, currentIndex]);
  const currentAnswerState = useMemo(() => answers[currentIndex] || { isAnswered: false, openAnswerAttempts: 0 }, [answers, currentIndex]);
  const isCorrect = currentAnswerState.isCorrect;

  const sessionProgress = ((currentIndex + 1) / sessionQuestions.length) * 100;
  
  const updateAnswer = (index: number, update: Partial<AnswerState[number]>) => {
    setAnswers(prev => ({
      ...prev,
      [index]: { ...(prev[index] || {}), ...update }
    }));
  }

  const handleOptionSelect = (optionId: string) => {
    if (!hasEnergy) return; // Although button is disabled, good to double check
    const isAnswerCorrect = currentQuestion.type === 'multiple-choice' && optionId === (currentQuestion as any).correctAnswer;
    if (isAnswerCorrect) {
        setMasteryProgress(prev => Math.min(prev + 10, 100));
    }
    updateAnswer(currentIndex, { selectedOption: optionId, isAnswered: true, isCorrect: isAnswerCorrect });
  };

  const handleOpenAnswerTextChange = (text: string) => {
    setCurrentOpenAnswerText(text);
    if (openAnswerFeedback) {
        setOpenAnswerFeedback(null);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!currentOpenAnswerText.trim()) return;

    setIsLoading(true);
    setOpenAnswerFeedback(null);

    const attempts = currentAnswerState.openAnswerAttempts || 0;
    
    // This part does not consume energy
    const result = await handleEvaluateOpenAnswer({
        question: currentQuestion.question,
        correctAnswer: currentQuestion.correctAnswerText,
        userAnswer: currentOpenAnswerText,
    });

    if (result.evaluation?.isCorrect) {
        setMasteryProgress(prev => Math.min(prev + 10, 100));
        updateAnswer(currentIndex, { isAnswered: true, isCorrect: true, userAnswer: currentOpenAnswerText });
    } else {
        if (attempts >= 2) { // This was the 3rd attempt (0, 1, 2)
            updateAnswer(currentIndex, { isAnswered: true, isCorrect: false, userAnswer: currentOpenAnswerText, openAnswerAttempts: attempts + 1 });
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
             updateAnswer(currentIndex, { openAnswerAttempts: attempts + 1, userAnswer: currentOpenAnswerText });
        }
    }
    
    setCurrentOpenAnswerText('');
    setIsLoading(false);
  };


  const handleShowAnswer = () => {
      if (currentQuestion.type === 'multiple-choice') {
          handleOptionSelect((currentQuestion as any).correctAnswer);
      } else if (currentQuestion.type === 'open-answer') {
          updateAnswer(currentIndex, { isAnswered: true, isCorrect: false });
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

  const goToNext = () => {
      if (currentIndex < sessionQuestions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setOpenAnswerFeedback(null);
      }
  };


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
              <CardTitle className="text-lg md:text-xl">Pregunta {currentAnswerState.openAnswerAttempts > 0 && currentAnswerState.openAnswerAttempts < 4 ? `(Intento ${currentAnswerState.openAnswerAttempts})` : ''}</CardTitle>
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

          {currentQuestion.type === 'multiple-choice' ? (
            <MultipleChoiceQuestion 
              question={currentQuestion}
              answerState={currentAnswerState}
              onOptionSelect={handleOptionSelect}
            />
          ) : (
            <OpenAnswerQuestion 
              onAnswerSubmit={handleAnswerSubmit}
              isAnswered={currentAnswerState.isAnswered}
              isLoading={isLoading}
              userAnswer={currentOpenAnswerText}
              onUserAnswerChange={handleOpenAnswerTextChange}
              feedback={openAnswerFeedback}
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
         <MagicHelpPopover 
            currentQuestion={currentQuestion} 
            correctAnswer={currentQuestion.correctAnswerText || ''}
            onShowAnswer={handleShowAnswer}
            onRephrase={handleRephrase}
            isAnswered={currentAnswerState.isAnswered}
          />
       </div>

    </div>
  );
}

    

    




