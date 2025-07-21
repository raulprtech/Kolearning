'use client';

import { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import type { Project, Flashcard } from '@/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const SESSION_LENGTH = 5;

export default function FlashcardViewer({ project, initialFlashcards }: { project: Project, initialFlashcards: Flashcard[] }) {
  const [shuffledFlashcards, setShuffledFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Shuffle flashcards once on component mount
    setShuffledFlashcards([...initialFlashcards].sort(() => Math.random() - 0.5));
  }, [initialFlashcards]);

  const currentFlashcard = useMemo(() => {
    return shuffledFlashcards[currentIndex];
  }, [currentIndex, shuffledFlashcards]);

  const handleNextCard = async () => {
    if (currentIndex < SESSION_LENGTH - 1 && currentIndex < shuffledFlashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setSessionCompleted(true);
      try {
        await fetch('/api/session-complete', { method: 'POST' });
        toast({
            title: "Session Complete!",
            description: "Your streak has been updated. Keep up the great work!",
        });
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Could not update your session streak.",
        });
      }
    }
  };

  if (shuffledFlashcards.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <p className="text-muted-foreground mt-4">This project has no flashcards.</p>
        <Button asChild className="mt-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  if (sessionCompleted) {
    return (
        <div className="container mx-auto flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
            <p className="text-muted-foreground mb-6">You've finished this learning session. Great job!</p>
            <Button asChild>
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="mb-4 text-center">
          <Link href="/" className="text-sm text-primary hover:underline flex items-center justify-center mb-4">
             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Link>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground">
            Card {currentIndex + 1} of {Math.min(SESSION_LENGTH, shuffledFlashcards.length)}
          </p>
        </div>
        
        <Progress value={((currentIndex + 1) / Math.min(SESSION_LENGTH, shuffledFlashcards.length)) * 100} className="mb-6" />

        <Card className="min-h-[300px] flex flex-col">
          <CardHeader>
            <CardTitle>{isFlipped ? 'Answer' : 'Question'}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow text-lg prose prose-p:my-2 prose-p:leading-relaxed">
            {isFlipped ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentFlashcard.answer}</ReactMarkdown>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentFlashcard.question}</ReactMarkdown>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {!isFlipped ? (
              <Button onClick={() => setIsFlipped(true)} className="w-full">
                Show Answer
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button variant="outline" onClick={handleNextCard} className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                  <XCircle className="mr-2 h-4 w-4" /> Incorrect
                </Button>
                <Button variant="outline" onClick={handleNextCard} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                  <CheckCircle className="mr-2 h-4 w-4" /> Correct
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
