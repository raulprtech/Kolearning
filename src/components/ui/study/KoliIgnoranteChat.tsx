'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send, GraduationCap, Brain, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChatMessage = {
    role: 'user' | 'koli';
    content: string;
};

type KoliIgnoranteChatProps = {
    /** The concept the user should teach */
    concept: string;
    /** The expected correct explanation */
    expectedExplanation: string;
    /** Koli's initial "ignorant" question */
    initialQuestion?: string;
    onComplete: (mastered: boolean) => void;
    onAnswerSelect: (fullConversation: string) => void;
};

/**
 * Chat component for the Prueba de Dominio phase.
 * Koli pretends to be ignorant about a topic and the user must teach it.
 * Koli asks probing questions to test whether the user truly understands.
 * After 3-5 exchanges, Koli evaluates if the user demonstrated mastery.
 */
export const KoliIgnoranteChat = ({
    concept,
    expectedExplanation,
    initialQuestion,
    onComplete,
    onAnswerSelect,
}: KoliIgnoranteChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [exchangeCount, setExchangeCount] = useState(0);
    const [isEvaluationDone, setIsEvaluationDone] = useState(false);
    const [masteryResult, setMasteryResult] = useState<{ mastered: boolean; feedback: string } | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const MAX_EXCHANGES = 5;

    useEffect(() => {
        const koliIntro: ChatMessage = {
            role: 'koli',
            content: initialQuestion || `Hi! I've heard about "${concept}" but I don't quite understand it. Could you explain what it is and why it's important? 🤔`,
        };
        setMessages([koliIntro]);
        setExchangeCount(0);
        setIsEvaluationDone(false);
        setMasteryResult(null);
        setCurrentInput('');
    }, [concept, initialQuestion]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!currentInput.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: currentInput };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setCurrentInput('');
        setIsLoading(true);

        const newExchangeCount = exchangeCount + 1;
        setExchangeCount(newExchangeCount);

        // Update the full conversation for recording
        const fullConversation = updatedMessages
            .map(m => `${m.role === 'user' ? 'Usuario' : 'Koli'}: ${m.content}`)
            .join('\n');
        onAnswerSelect(fullConversation);

        try {
            const { koliIgnoranteRespond } = await import('@/ai/flows/koli-ignorante-chat');

            const shouldEvaluate = newExchangeCount >= 3;

            const result = await koliIgnoranteRespond({
                concept,
                expectedExplanation,
                conversationHistory: JSON.stringify(updatedMessages),
                exchangeCount: newExchangeCount,
                shouldEvaluate,
            });

            const koliResponse: ChatMessage = { role: 'koli', content: result.response };
            setMessages(prev => [...prev, koliResponse]);

            if (result.evaluationDone) {
                setIsEvaluationDone(true);
                setMasteryResult({
                    mastered: result.mastered,
                    feedback: result.evaluationFeedback || '',
                });
                onComplete(result.mastered);
            }
        } catch (error) {
            console.error('Error in Koli Ignorante chat:', error);
            const errorResponse: ChatMessage = {
                role: 'koli',
                content: "Oh! I had a little trouble processing that. Could you try explaining it to me in another way?",
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="mt-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                    <p className="font-medium text-sm">Mode: Teach the Tutor</p>
                    <p className="text-xs text-muted-foreground">
                        The Tutor doesn't know about "{concept}". Teach them as if you were their tutor.
                    </p>
                </div>
            </div>

            {/* Chat Messages */}
            <Card className="bg-card/50">
                <CardContent className="p-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'flex gap-3',
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                {msg.role === 'koli' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                        <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        'max-w-[80%] p-3 rounded-lg text-sm',
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                                            : 'bg-muted rounded-bl-sm'
                                    )}
                                >
                                    {msg.content}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <MessageCircle className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                    <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="p-3 rounded-lg bg-muted text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    {!isEvaluationDone && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Input
                                placeholder="Explain to the Tutor..."
                                value={currentInput}
                                onChange={(e) => setCurrentInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button
                                size="icon"
                                onClick={handleSend}
                                disabled={isLoading || !currentInput.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Exchange counter */}
                    {!isEvaluationDone && (
                        <div className="text-xs text-muted-foreground text-center mt-2">
                            Exchange {exchangeCount}/{MAX_EXCHANGES}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mastery Result */}
            {masteryResult && (
                <Card className={cn(
                    'border-2',
                    masteryResult.mastered
                        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20'
                        : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                )}>
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                            <GraduationCap className={cn(
                                'h-6 w-6 mt-0.5',
                                masteryResult.mastered ? 'text-green-600' : 'text-amber-600'
                            )} />
                            <div>
                                <p className="font-semibold text-base">
                                    {masteryResult.mastered
                                        ? 'Mastery demonstrated! 🎉'
                                        : 'Great effort! Almost there 💪'}
                                </p>
                                <p className="text-sm mt-1 text-muted-foreground">
                                    {masteryResult.feedback}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default KoliIgnoranteChat;
