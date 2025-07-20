
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Zap, TrendingUp, CheckCircle, XCircle, Lightbulb, Repeat, Frown, Meh, Smile, RefreshCw, Eye, Wand2, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const sessionQuestions = [
  {
    type: 'multiple-choice',
    question: 'What is the output of the following code?',
    code: '```javascript\nconsole.log(typeof null);\n```',
    options: [
      { id: 'A', text: '`null`' },
      { id: 'B', text: '`undefined`' },
      { id: 'C', text: '`object`' },
      { id: 'D', text: '`string`' },
    ],
    correctAnswer: 'C',
  },
  {
    type: 'open-answer',
    question: 'Explain the difference between `let`, `const`, and `var` in JavaScript.',
  },
  {
    type: 'multiple-choice',
    question: 'Which of these is NOT a primitive data type in JavaScript?',
    options: [
        { id: 'A', text: '`string`' },
        { id: 'B', text: '`number`' },
        { id: 'C', text: '`array`' },
        { id: 'D', text: '`boolean`' },
    ],
    correctAnswer: 'C',
  },
   {
    type: 'open-answer',
    question: 'What is a closure in JavaScript? Provide a simple code example.',
  },
];

type AnswerState = {
    [key: number]: {
        isAnswered: boolean;
        selectedOption?: string;
        answerText?: string;
    };
};

const QuestionHelperActions = () => (
    <div className="flex justify-end items-center gap-2 mb-4 -mt-2">
        <Button variant="outline" size="sm" className="text-muted-foreground">
            <Lightbulb className="mr-2 h-4 w-4" />
            Pista
        </Button>
        <Button variant="outline" size="sm" className="text-muted-foreground">
            <Eye className="mr-2 h-4 w-4" />
            Ver Respuesta
        </Button>
        <Button variant="outline" size="sm" className="text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reformular
        </Button>
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
      <QuestionHelperActions />
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
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn(
                "h-8 w-8 rounded-md flex items-center justify-center font-bold text-sm shrink-0",
                "bg-muted text-muted-foreground",
                selectedOption === option.id && 'bg-primary text-primary-foreground'
              )}>
                {option.id}
              </div>
              <div className="prose prose-invert prose-sm prose-p:my-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{option.text}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

const OpenAnswerQuestion = ({ onAnswerSubmit, isAnswered }: any) => {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <Textarea 
                placeholder="Escribe tu respuesta aquí..."
                className="min-h-[150px] bg-card/70 border-primary/20 text-base"
                disabled={isAnswered}
            />
            {!isAnswered && (
                <>
                    <QuestionHelperActions />
                    <div className="flex justify-end">
                        <Button onClick={onAnswerSubmit}>Enviar Respuesta</Button>
                    </div>
                </>
            )}
        </div>
    );
};

const MagicHelpPanel = () => (
  <Card className="bg-card/70 sticky top-24">
      <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Ayuda Mágica
          </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
          <Button variant="outline"><Lightbulb className="mr-2 h-4 w-4" /> Pista</Button>
          <Button variant="outline"><Eye className="mr-2 h-4 w-4" /> Ver Respuesta</Button>
          <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Reformular</Button>
          <Button variant="outline"><Lightbulb className="mr-2 h-4 w-4" /> Explicar</Button>
      </CardContent>
  </Card>
);

const MagicHelpPopover = () => (
   <Popover>
    <PopoverTrigger asChild>
       <Button
        variant="default"
        size="lg"
        className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg shadow-primary/30"
      >
        <Wand2 className="h-8 w-8" />
        <span className="sr-only">Ayuda Mágica</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-80 mb-2 mr-2" side="top" align="end">
      <div className="grid gap-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Ayuda Mágica</h4>
          <p className="text-sm text-muted-foreground">
            Usa estas herramientas para ayudarte a aprender.
          </p>
        </div>
        <div className="grid gap-2">
           <Button variant="outline"><Lightbulb className="mr-2 h-4 w-4" /> Pista</Button>
           <Button variant="outline"><Eye className="mr-2 h-4 w-4" /> Ver Respuesta</Button>
           <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Reformular</Button>
           <Button variant="outline"><Lightbulb className="mr-2 h-4 w-4" /> Explicar</Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
);


export default function AprenderPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [masteryProgress, setMasteryProgress] = useState(10);
  const [bestStreak, setBestStreak] = useState(1);

  const currentQuestion = useMemo(() => sessionQuestions[currentIndex], [currentIndex]);
  const currentAnswerState = useMemo(() => answers[currentIndex] || { isAnswered: false }, [answers, currentIndex]);

  const sessionProgress = ((currentIndex + 1) / sessionQuestions.length) * 100;
  
  const updateAnswer = (index: number, update: Partial<AnswerState[number]>) => {
    setAnswers(prev => ({
      ...prev,
      [index]: { ...prev[index], ...update, isAnswered: true }
    }));
  }

  const handleOptionSelect = (optionId: string) => {
    if (currentQuestion.type === 'multiple-choice' && optionId === (currentQuestion as any).correctAnswer) {
        setMasteryProgress(prev => Math.min(prev + 10, 100));
    }
    updateAnswer(currentIndex, { selectedOption: optionId });
  };

  const handleAnswerSubmit = () => {
    // For open answers, we can't auto-check, so we don't award points here automatically.
    // This could be a feature for later where AI evaluates the answer.
    updateAnswer(currentIndex, { answerText: 'dummy' });
  };
  
  const handleRepeatQuestion = () => {
    setAnswers(prev => {
        const newAnswers = {...prev};
        delete newAnswers[currentIndex];
        return newAnswers;
    });
  };

  const goToNext = () => {
      if (currentIndex < sessionQuestions.length - 1) {
          setCurrentIndex(prev => prev + 1);
      }
  };

  const isCorrect = currentQuestion.type === 'multiple-choice' && currentAnswerState.selectedOption === (currentQuestion as any).correctAnswer;

  return (
    <div className="container mx-auto py-8">
      <div className="xl:grid xl:grid-cols-3 xl:gap-8">

        {/* Main Content Column */}
        <div className="xl:col-span-2">
          <div className="mb-4">
            <Link href="/" className="text-sm text-primary hover:underline flex items-center mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Salir de la sesión
            </Link>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-4">
                <div className="mb-4 sm:mb-0">
                  <h2 className="text-sm text-muted-foreground mb-1">Estás aprendiendo</h2>
                  <h1 className="text-2xl font-bold">JavaScript Fundamentals</h1>
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="font-bold">{masteryProgress}%</p>
                      <p className="text-xs text-muted-foreground">Dominio</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                     <div>
                      <p className="font-bold">{bestStreak}</p>
                      <p className="text-xs text-muted-foreground">Mejor Racha</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Progreso de la sesión ({currentIndex + 1}/{sessionQuestions.length})</p>
                <Progress value={sessionProgress} />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 bg-card/70">
            <CardHeader>
              <CardTitle className="text-xl">Pregunta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-p:my-2 prose-p:leading-relaxed prose-pre:bg-black/50">
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
            />
          )}
          
          {currentAnswerState.isAnswered && (
               <div className="flex justify-between items-center bg-card/70 border rounded-lg p-4">
                   <div className="flex items-center gap-4">
                      {currentQuestion.type === 'multiple-choice' && (
                           isCorrect ? (
                              <div className="flex items-center gap-2">
                                  <CheckCircle className="h-6 w-6 text-green-500" />
                                  <p className="font-bold text-lg">¡Correcto!</p>
                              </div>
                          ) : (
                               <div className="flex items-center gap-2">
                                  <XCircle className="h-6 w-6 text-red-500" />
                                  <p className="font-bold text-lg">Respuesta incorrecta</p>
                              </div>
                          )
                      )}
                      {currentQuestion.type === 'open-answer' && (
                          <p className="font-bold text-lg">Respuesta enviada</p>
                      )}
                   </div>
                  <div className="flex gap-2">
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

        {/* Help Column */}
        <div className="hidden xl:block">
            <MagicHelpPanel />
        </div>
      </div>

       <div className="xl:hidden">
         <MagicHelpPopover />
       </div>

    </div>
  );
}
