'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type BlankSegment = {
    text: string;
    isBlank: boolean;
    answer?: string;
};

type FillBlankQuestionProps = {
    /** The sentence with blanks represented as segments */
    segments: BlankSegment[];
    /** Full question text for display */
    questionText: string;
    onComplete: (isCorrect: boolean) => void;
    onAnswerSelect: (answer: string) => void;
};

/**
 * Question component for Incursión phase (2nd half).
 * Shows a sentence with blanks that the user must fill in.
 * Blanks are represented as inline text inputs within the sentence.
 */
export const FillBlankQuestion = ({ segments, questionText, onComplete, onAnswerSelect }: FillBlankQuestionProps) => {
    const blankCount = segments.filter(s => s.isBlank).length;
    const [answers, setAnswers] = useState<string[]>(new Array(blankCount).fill(''));
    const [isRevealed, setIsRevealed] = useState(false);
    const [results, setResults] = useState<boolean[]>([]);

    useEffect(() => {
        setAnswers(new Array(blankCount).fill(''));
        setIsRevealed(false);
        setResults([]);
    }, [segments, blankCount]);

    const handleInputChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
        onAnswerSelect(newAnswers.join(' | '));
    };

    const handleCheck = () => {
        let blankIndex = 0;
        const checkResults: boolean[] = [];

        segments.forEach(segment => {
            if (segment.isBlank && segment.answer) {
                const userAnswer = answers[blankIndex]?.trim().toLowerCase() || '';
                const correctAnswer = segment.answer.trim().toLowerCase();
                checkResults.push(userAnswer === correctAnswer);
                blankIndex++;
            }
        });

        setResults(checkResults);
        setIsRevealed(true);
        const allCorrect = checkResults.every(r => r);
        onComplete(allCorrect);
    };

    const allFilled = answers.every(a => a.trim().length > 0);

    let blankIndex = 0;

    return (
        <div className="mt-6 space-y-6">
            <div className="p-6 bg-card/50 rounded-lg border">
                <div className="text-lg leading-relaxed flex flex-wrap items-center gap-1">
                    {segments.map((segment, i) => {
                        if (!segment.isBlank) {
                            return <span key={i}>{segment.text}</span>;
                        }

                        const currentBlankIndex = blankIndex;
                        blankIndex++;

                        return (
                            <span key={i} className="inline-flex items-center mx-1">
                                <Input
                                    className={cn(
                                        'w-40 h-8 text-center font-medium inline-block',
                                        isRevealed && results[currentBlankIndex] === true && 'border-green-500 bg-green-50 dark:bg-green-900/20',
                                        isRevealed && results[currentBlankIndex] === false && 'border-red-500 bg-red-50 dark:bg-red-900/20',
                                    )}
                                    placeholder="___"
                                    value={answers[currentBlankIndex]}
                                    onChange={(e) => handleInputChange(currentBlankIndex, e.target.value)}
                                    readOnly={isRevealed}
                                />
                                {isRevealed && results[currentBlankIndex] === false && segment.answer && (
                                    <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                                        ({segment.answer})
                                    </span>
                                )}
                            </span>
                        );
                    })}
                </div>
            </div>

            {!isRevealed && (
                <div className="flex justify-center">
                    <Button size="lg" onClick={handleCheck} disabled={!allFilled}>
                        Comprobar
                    </Button>
                </div>
            )}

            {isRevealed && (
                <div className="text-center">
                    <p className={cn(
                        'text-lg font-semibold',
                        results.every(r => r)
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-amber-600 dark:text-amber-400'
                    )}>
                        {results.every(r => r)
                            ? '¡Perfecto! Todas las respuestas son correctas.'
                            : `${results.filter(r => r).length} de ${results.length} espacios correctos.`}
                    </p>
                </div>
            )}
        </div>
    );
};

export default FillBlankQuestion;
