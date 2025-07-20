
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Zap, TrendingUp, Sparkles, Eye, Repeat, CheckCircle, XCircle, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  );
};

const OpenAnswerQuestion = ({ onAnswerSubmit }: any) => {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <Textarea 
                placeholder="Escribe tu respuesta aquí..."
                className="min-h-[150px] bg-card/70 border-primary/20 text-base"
            />
            <div className="flex justify-end gap-2">
                <Button variant="outline"><Lightbulb className="mr-2 h-4 w-4" /> Pista</Button>
                <Button variant="outline">Ver Respuesta</Button>
                <Button onClick={onAnswerSubmit}>Enviar Respuesta</Button>
            </div>
        </div>
    );
};


export default function AprenderPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);

  const currentQuestion = useMemo(() => sessionQuestions[currentIndex], [currentIndex]);
  const currentAnswerState = useMemo(() => answers[currentIndex] || { isAnswered: false }, [answers, currentIndex]);

  const sessionProgress = ((currentIndex + 1) / sessionQuestions.length) * 100;
  const masteryProgress = 10;
  const energy = 5;

  const updateAnswer = (index: number, update: Partial<AnswerState[number]>) => {
    setAnswers(prev => ({
      ...prev,
      [index]: { ...prev[index], ...update, isAnswered: true }
    }));
    setIsRatingOpen(true);
    setShowNavigation(false);
  }

  const handleOptionSelect = (optionId: string) => {
    updateAnswer(currentIndex, { selectedOption: optionId });
  };

  const handleAnswerSubmit = () => {
    updateAnswer(currentIndex, { answerText: 'dummy' });
  };

  const handleRatingSubmit = () => {
      setIsRatingOpen(false);
      setShowNavigation(true);
  }

  const goToNext = () => {
      if (currentIndex < sessionQuestions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setShowNavigation(false);
      }
  };

  const goToPrevious = () => {
      if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setShowNavigation(false);
      }
  };

  const isCorrect = currentQuestion.type === 'multiple-choice' && currentAnswerState.selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="container mx-auto py-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="mb-4">
          <Link href="/" className="text-sm text-primary hover:underline flex items-center mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Salir de la sesión
          </Link>
          <h1 className="text-3xl font-bold">JavaScript Fundamentals</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-6">
              <div className="w-full">
                <p className="text-sm text-muted-foreground mb-1">Progreso de la sesión ({currentIndex + 1}/{sessionQuestions.length})</p>
                <Progress value={sessionProgress} />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="font-bold">{masteryProgress}%</p>
                    <p className="text-xs text-muted-foreground">Dominio</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                   <div>
                    <p className="font-bold">{energy}</p>
                    <p className="text-xs text-muted-foreground">Energía</p>
                  </div>
                </div>
              </div>
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
                        {currentQuestion.code}
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
          />
        )}
        
        {currentAnswerState.isAnswered && !isRatingOpen && (
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
                    <Button variant="outline" size="sm">
                        <Lightbulb className="mr-2 h-4 w-4" />
                        Explicar
                    </Button>
                 </div>
                {showNavigation && (
                    <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={goToPrevious} disabled={currentIndex === 0}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button size="icon" onClick={goToNext} disabled={currentIndex === sessionQuestions.length - 1}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>
        )}

        <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-lg">¿Qué tan difícil se te hizo la pregunta?</DialogTitle>
                </DialogHeader>
                <div className="py-4 px-2">
                    <Slider
                        defaultValue={[50]}
                        max={100}
                        step={1}
                        className="my-4"
                    />
                     <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Muy Fácil</span>
                        <span>Muy Difícil</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleRatingSubmit} className="w-full">Continuar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

    