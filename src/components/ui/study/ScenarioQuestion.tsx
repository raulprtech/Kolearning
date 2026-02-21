'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScenarioQuestionProps = {
    /** The hypothetical scenario text */
    scenario: string;
    /** The specific question about the scenario */
    question: string;
    /** The expected reasoning/answer */
    expectedAnswer: string;
    /** Related atom concepts for context */
    relatedConcepts: string[];
    onComplete: (isCorrect: boolean, reasoning?: string) => void;
    onAnswerSelect: (answer: string) => void;
};

type ReasoningEvaluation = {
    isStrong: boolean;
    strengthScore: number; // 0-100
    feedback: string;
    strengths: string[];
    improvements: string[];
};

/**
 * Question component for the Refuerzo phase.
 * Presents a hypothetical scenario and asks the user to reason through it.
 * Evaluates the quality of reasoning, not just correctness.
 */
export const ScenarioQuestion = ({
    scenario,
    question,
    expectedAnswer,
    relatedConcepts,
    onComplete,
    onAnswerSelect,
}: ScenarioQuestionProps) => {
    const [userReasoning, setUserReasoning] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluation, setEvaluation] = useState<ReasoningEvaluation | null>(null);

    useEffect(() => {
        setUserReasoning('');
        setEvaluation(null);
        setIsEvaluating(false);
    }, [scenario, question]);

    const handleEvaluate = async () => {
        if (!userReasoning.trim()) return;
        setIsEvaluating(true);
        onAnswerSelect(userReasoning);

        try {
            const { evaluateReasoning } = await import('@/ai/flows/evaluate-reasoning');
            const result = await evaluateReasoning({
                scenario,
                question,
                expectedAnswer,
                userReasoning,
                relatedConcepts: relatedConcepts.join(', '),
            });

            setEvaluation({
                isStrong: result.isStrong,
                strengthScore: result.strengthScore,
                feedback: result.feedback,
                strengths: result.strengths,
                improvements: result.improvements,
            });

            onComplete(result.isStrong, result.feedback);
        } catch (error) {
            console.error('Error evaluating reasoning:', error);
            // Fallback: just compare text similarity
            setEvaluation({
                isStrong: false,
                strengthScore: 50,
                feedback: 'No se pudo evaluar tu razonamiento automáticamente. Por favor, compáralo con la respuesta esperada.',
                strengths: [],
                improvements: ['Revisa la respuesta esperada para comparar'],
            });
            onComplete(false);
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="mt-6 space-y-4">
            {/* Scenario Card */}
            <Card className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Escenario Hipotético
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-base leading-relaxed">{scenario}</p>
                </CardContent>
            </Card>

            {/* Question */}
            <div className="p-4 bg-card/50 rounded-lg border">
                <p className="font-medium text-base">{question}</p>
            </div>

            {/* Related concepts hint */}
            {relatedConcepts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Conceptos relacionados:</span>
                    {relatedConcepts.map((concept, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            {concept}
                        </span>
                    ))}
                </div>
            )}

            {/* User reasoning input */}
            <Textarea
                rows={6}
                placeholder="Escribe tu razonamiento aquí. Explica tu análisis del escenario y justifica tu respuesta..."
                className="bg-background text-lg"
                value={userReasoning}
                onChange={(e) => setUserReasoning(e.target.value)}
                readOnly={!!evaluation}
            />

            {!evaluation && (
                <div className="flex justify-center">
                    <Button
                        size="lg"
                        className="w-full max-w-xs"
                        onClick={handleEvaluate}
                        disabled={isEvaluating || !userReasoning.trim()}
                    >
                        {isEvaluating ? <Loader2 className="animate-spin mr-2" /> : null}
                        {isEvaluating ? 'Evaluando razonamiento...' : 'Evaluar Razonamiento'}
                    </Button>
                </div>
            )}

            {/* Evaluation Results */}
            {evaluation && (
                <Card className={cn(
                    'border-2',
                    evaluation.isStrong
                        ? 'border-green-200 dark:border-green-800'
                        : 'border-amber-200 dark:border-amber-800'
                )}>
                    <CardContent className="pt-4 space-y-3">
                        {/* Score bar */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">Solidez del razonamiento:</span>
                            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-500',
                                        evaluation.strengthScore >= 70 ? 'bg-green-500' :
                                            evaluation.strengthScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                    )}
                                    style={{ width: `${evaluation.strengthScore}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold">{evaluation.strengthScore}%</span>
                        </div>

                        {/* Feedback */}
                        <p className="text-base">{evaluation.feedback}</p>

                        {/* Strengths */}
                        {evaluation.strengths.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">
                                    Puntos fuertes:
                                </h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* Areas for improvement */}
                        {evaluation.improvements.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
                                    Áreas de mejora:
                                </h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    {evaluation.improvements.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ScenarioQuestion;
