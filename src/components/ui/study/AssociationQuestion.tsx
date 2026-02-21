'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Atom } from '@/contexts/ProjectContext';

type AssociationPair = {
    id: string;
    concept: string;
    definition: string;
};

type AssociationQuestionProps = {
    pairs: AssociationPair[];
    onComplete: (isCorrect: boolean) => void;
    onAnswerSelect: (answer: string) => void;
};

/**
 * Question component for the Incursión phase (1st half).
 * Shows concepts on the left and definitions on the right.
 * User must match each concept with its correct definition.
 */
export const AssociationQuestion = ({ pairs, onComplete, onAnswerSelect }: AssociationQuestionProps) => {
    const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
    const [matches, setMatches] = useState<Record<string, string>>({});
    const [isRevealed, setIsRevealed] = useState(false);
    const [shuffledDefinitions, setShuffledDefinitions] = useState<AssociationPair[]>([]);

    useEffect(() => {
        setShuffledDefinitions([...pairs].sort(() => Math.random() - 0.5));
        setMatches({});
        setSelectedConcept(null);
        setIsRevealed(false);
    }, [pairs]);

    const handleConceptClick = (conceptId: string) => {
        if (isRevealed) return;
        setSelectedConcept(conceptId === selectedConcept ? null : conceptId);
    };

    const handleDefinitionClick = (definitionId: string) => {
        if (isRevealed || !selectedConcept) return;

        const newMatches = { ...matches, [selectedConcept]: definitionId };
        setMatches(newMatches);
        setSelectedConcept(null);

        // If all concepts are matched, report the answer
        if (Object.keys(newMatches).length === pairs.length) {
            const answerString = Object.entries(newMatches)
                .map(([conceptId, defId]) => `${conceptId}:${defId}`)
                .join(',');
            onAnswerSelect(answerString);
        }
    };

    const handleCheck = () => {
        setIsRevealed(true);
        const allCorrect = pairs.every(
            pair => matches[pair.id] === pair.id
        );
        onComplete(allCorrect);
    };

    const getConceptStyle = (conceptId: string) => {
        if (selectedConcept === conceptId) return 'ring-2 ring-primary bg-primary/10';
        if (matches[conceptId]) {
            if (isRevealed) {
                return matches[conceptId] === conceptId
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                    : 'bg-red-100 dark:bg-red-900/30 border-red-500';
            }
            return 'bg-muted/50 opacity-60';
        }
        return 'hover:bg-muted/50 cursor-pointer';
    };

    const getDefinitionStyle = (defId: string) => {
        const isMatched = Object.values(matches).includes(defId);
        if (isMatched) {
            if (isRevealed) {
                const conceptId = Object.entries(matches).find(([, d]) => d === defId)?.[0];
                return conceptId === defId
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                    : 'bg-red-100 dark:bg-red-900/30 border-red-500';
            }
            return 'bg-muted/50 opacity-60';
        }
        if (selectedConcept) return 'hover:bg-primary/10 cursor-pointer';
        return '';
    };

    const allMatched = Object.keys(matches).length === pairs.length;

    return (
        <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
                Selecciona un concepto a la izquierda y luego su definición a la derecha para asociarlos.
            </p>
            <div className="grid grid-cols-2 gap-4">
                {/* Concepts column */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Conceptos</h4>
                    {pairs.map(pair => (
                        <div
                            key={`concept-${pair.id}`}
                            onClick={() => handleConceptClick(pair.id)}
                            className={cn(
                                'p-3 rounded-lg border transition-all text-sm',
                                getConceptStyle(pair.id)
                            )}
                        >
                            {pair.concept}
                        </div>
                    ))}
                </div>

                {/* Definitions column */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Definiciones</h4>
                    {shuffledDefinitions.map(pair => (
                        <div
                            key={`def-${pair.id}`}
                            onClick={() => handleDefinitionClick(pair.id)}
                            className={cn(
                                'p-3 rounded-lg border transition-all text-sm',
                                getDefinitionStyle(pair.id)
                            )}
                        >
                            {pair.definition}
                        </div>
                    ))}
                </div>
            </div>

            {allMatched && !isRevealed && (
                <div className="flex justify-center mt-4">
                    <Button size="lg" onClick={handleCheck}>
                        Comprobar Asociaciones
                    </Button>
                </div>
            )}

            {isRevealed && (
                <div className="text-center mt-4">
                    <p className={cn(
                        'text-lg font-semibold',
                        pairs.every(p => matches[p.id] === p.id)
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-amber-600 dark:text-amber-400'
                    )}>
                        {pairs.every(p => matches[p.id] === p.id)
                            ? '¡Excelente! Todas las asociaciones son correctas.'
                            : 'Algunas asociaciones necesitan ajuste. Revisa las marcadas en rojo.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AssociationQuestion;
