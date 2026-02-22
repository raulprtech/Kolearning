import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../card';
import { Button } from '../button';
import { Atom } from '@/contexts/ProjectContext';
import { CheckCircle, HelpCircle, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchingGameQuestionProps {
    atom: Atom;
    onAnswerSubmit: (isCorrect: boolean, responseTime: number) => void;
}

interface GameItem {
    id: string;
    text: string;
    originalPairId: string;
    type: 'term' | 'definition';
}

export const MatchingGameQuestion: React.FC<MatchingGameQuestionProps> = ({ atom, onAnswerSubmit }) => {
    const [terms, setTerms] = useState<GameItem[]>([]);
    const [definitions, setDefinitions] = useState<GameItem[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<GameItem | null>(null);
    const [selectedDefinition, setSelectedDefinition] = useState<GameItem | null>(null);
    const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
    const [errors, setErrors] = useState(0);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [startTime, setStartTime] = useState<number>(Date.now());

    useEffect(() => {
        const pairs = atom.payload?.pairs || [];

        let termsList: GameItem[] = [];
        let defsList: GameItem[] = [];

        pairs.forEach((pair: any, index: number) => {
            const pairId = pair.id || String(index);
            termsList.push({ id: `t-${pairId}`, text: pair.term, originalPairId: pairId, type: 'term' });
            defsList.push({ id: `d-${pairId}`, text: pair.definition, originalPairId: pairId, type: 'definition' });
        });

        // Shuffle arrays
        const shuffleArray = (array: GameItem[]) => {
            const newArr = [...array];
            for (let i = newArr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
            }
            return newArr;
        };

        setTerms(shuffleArray(termsList));
        setDefinitions(shuffleArray(defsList));
        setMatchedPairs(new Set());
        setErrors(0);
        setGameCompleted(false);
        setStartTime(Date.now());
        setSelectedTerm(null);
        setSelectedDefinition(null);
    }, [atom.id]);

    useEffect(() => {
        if (selectedTerm && selectedDefinition) {
            if (selectedTerm.originalPairId === selectedDefinition.originalPairId) {
                // Match!
                setMatchedPairs(prev => new Set(prev).add(selectedTerm.originalPairId));
                setSelectedTerm(null);
                setSelectedDefinition(null);
            } else {
                // Mismatch
                setErrors(prev => prev + 1);
                setTimeout(() => {
                    setSelectedTerm(null);
                    setSelectedDefinition(null);
                }, 800);
            }
        }
    }, [selectedTerm, selectedDefinition]);

    useEffect(() => {
        const totalPairs = atom.payload?.pairs?.length || 0;
        if (totalPairs > 0 && matchedPairs.size === totalPairs && !gameCompleted) {
            setGameCompleted(true);
        }
    }, [matchedPairs.size, atom.payload?.pairs?.length, gameCompleted]);

    const handleTermClick = (item: GameItem) => {
        if (matchedPairs.has(item.originalPairId)) return;
        setSelectedTerm(item.id === selectedTerm?.id ? null : item);
    };

    const handleDefClick = (item: GameItem) => {
        if (matchedPairs.has(item.originalPairId)) return;
        setSelectedDefinition(item.id === selectedDefinition?.id ? null : item);
    };

    const handleFinish = () => {
        const responseTime = (Date.now() - startTime) / 1000;
        // Perfect game or 1 error = correct, too many errors = incorrect
        const isCorrect = errors <= 1;
        onAnswerSubmit(isCorrect, responseTime);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto border-2 border-primary/20 shadow-lg mt-8 bg-background">
            <CardContent className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b text-primary">
                    <div className="flex items-center gap-2">
                        <Shuffle className="w-5 h-5" />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Reto de Relación</h3>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                        Errores: <span className={errors > 0 ? "text-red-500" : ""}>{errors}</span>
                    </div>
                </div>

                <div className="mb-8 text-center">
                    <p className="text-lg font-medium">{atom.question || "Une cada concepto con su definición."}</p>
                </div>

                {!gameCompleted ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Terms Column */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase text-center mb-4">Conceptos</h4>
                            {terms.map(item => {
                                const isMatched = matchedPairs.has(item.originalPairId);
                                const isSelected = selectedTerm?.id === item.id;
                                const isError = isSelected && selectedDefinition && selectedTerm.originalPairId !== selectedDefinition.originalPairId;

                                return (
                                    <button
                                        key={item.id}
                                        disabled={isMatched}
                                        onClick={() => handleTermClick(item)}
                                        className={cn(
                                            "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                                            isMatched
                                                ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 opacity-50 cursor-default"
                                                : isError
                                                    ? "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400"
                                                    : isSelected
                                                        ? "bg-primary/10 border-primary text-primary shadow-md scale-[1.02]"
                                                        : "bg-muted/50 border-muted-foreground/20 hover:border-primary/50 hover:bg-muted"
                                        )}
                                    >
                                        {item.text}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Definitions Column */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase text-center mb-4">Definiciones</h4>
                            {definitions.map(item => {
                                const isMatched = matchedPairs.has(item.originalPairId);
                                const isSelected = selectedDefinition?.id === item.id;
                                const isError = isSelected && selectedTerm && selectedDefinition.originalPairId !== selectedTerm.originalPairId;

                                return (
                                    <button
                                        key={item.id}
                                        disabled={isMatched}
                                        onClick={() => handleDefClick(item)}
                                        className={cn(
                                            "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                                            isMatched
                                                ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 opacity-50 cursor-default"
                                                : isError
                                                    ? "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400"
                                                    : isSelected
                                                        ? "bg-primary/10 border-primary text-primary shadow-md scale-[1.02]"
                                                        : "bg-muted/50 border-muted-foreground/20 hover:border-primary/50 hover:bg-muted"
                                        )}
                                    >
                                        {item.text}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center mb-6">
                            <CheckCircle className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">¡Nivel Completado!</h2>
                        <p className="text-muted-foreground mb-8">
                            Has conectado correctamente todos los pares.
                            {errors === 0 ? " ¡Puntuación perfecta!" : ` Tuviste ${errors} intentos fallidos.`}
                        </p>
                        <Button size="lg" className="w-full sm:w-auto px-8" onClick={handleFinish}>
                            Continuar
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
