
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Zap, TrendingUp, Sparkles, Eye, Repeat, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const questionData = {
  question: 'What is the output of the following code?',
  code: '```javascript\nconsole.log(typeof null);\n```',
  options: [
    { id: 'A', text: '`null`' },
    { id: 'B', text: '`undefined`' },
    { id: 'C', text: '`object`' },
    { id: 'D', text: '`string`' },
  ],
  correctAnswer: 'C',
};

export default function AprenderPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const sessionProgress = 35;
  const masteryProgress = 10;
  const energy = 5;

  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
    setIsAnswered(true);
  };

  const getOptionClass = (optionId: string) => {
    if (!isAnswered) {
      return 'hover:bg-muted/80 hover:border-primary/50 cursor-pointer';
    }
    const isCorrect = optionId === questionData.correctAnswer;
    const isSelected = optionId === selectedOption;

    if (isCorrect) return 'border-green-500 bg-green-500/10 text-green-300';
    if (isSelected && !isCorrect) return 'border-red-500 bg-red-500/10 text-red-300';
    
    return 'opacity-50';
  };

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
                <p className="text-sm text-muted-foreground mb-1">Progreso de la sesión</p>
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
                    {questionData.question}
                </ReactMarkdown>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {questionData.code}
                </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {questionData.options.map(option => (
                 <Card 
                    key={option.id}
                    className={cn(
                        "transition-all duration-300 border-2 border-transparent",
                        getOptionClass(option.id)
                    )}
                    onClick={() => handleOptionSelect(option.id)}
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
        
        {isAnswered && (
             <div className="flex justify-between items-center bg-card/70 border rounded-lg p-4">
                 <div className="flex items-center gap-2">
                    {selectedOption === questionData.correctAnswer ? (
                        <>
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            <p className="font-bold text-lg">¡Correcto!</p>
                        </>
                    ) : (
                         <>
                            <XCircle className="h-6 w-6 text-red-500" />
                            <p className="font-bold text-lg">Respuesta incorrecta</p>
                        </>
                    )}
                 </div>
                <Button size="lg" onClick={() => { /* Logic to go to next question */ }}>
                    Continuar <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        )}

      </div>
    </div>
  );
}
