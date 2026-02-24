"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePlugins } from './PluginContext';
import { HookRegistry } from '@/core/domain/services/HookRegistry';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    metadata?: any;
    status: 'sending' | 'sent' | 'error';
}

interface AIContextType {
    messages: ChatMessage[];
    isTyping: boolean;
    status: string | null;
    sendMessage: (content: string) => Promise<void>;
    clearChat: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const { user, profile } = useAuth();
    const { userPlugins } = usePlugins();

    const assistantConfig = React.useMemo(() => {
        let config = null;
        if (profile?.additional_info) {
            try {
                const info = JSON.parse(profile.additional_info);
                config = info.assistant || null;
            } catch (e) {
                config = null;
            }
        }

        // Apply community skill filters to the assistant configuration
        return HookRegistry.applyFilters('filter_assistant_config', config);
    }, [profile]);

    const sendMessage = useCallback(async (content: string) => {
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
            status: 'sent'
        };

        const currentMessages = [...messages, userMsg];
        setMessages(currentMessages);
        setIsTyping(true);
        setStatus('Koli está pensando...');

        try {
            const response = await fetch('/api/ai/orchestrator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatHistory: currentMessages.map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    userName: profile?.name || 'Student',
                    userId: user?.id,
                    assistantConfig: assistantConfig,
                    enabledPlugins: userPlugins.filter(p => p.isEnabled).map(p => p.pluginId)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get AI response');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let accumulatedData = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                accumulatedData += decoder.decode(value, { stream: true });

                const lines = accumulatedData.split('\n\n');
                accumulatedData = lines.pop() || ''; // Keep the incomplete last part

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);
                        try {
                            const data = JSON.parse(jsonStr);

                            if (data.type === 'status') {
                                setStatus(data.content);
                            } else if (data.type === 'result') {
                                const assistantMsg: ChatMessage = {
                                    id: (Date.now() + 1).toString(),
                                    role: 'assistant',
                                    content: data.response,
                                    timestamp: new Date(),
                                    status: 'sent',
                                    metadata: {
                                        toolResults: data.toolResults
                                    }
                                };
                                setMessages(prev => [...prev, assistantMsg]);
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            }
                        } catch (e) {
                            console.error("Error parsing stream chunk:", e);
                        }
                    }
                }
            }

        } catch (error: any) {
            console.error("Error sending message:", error);
            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'system',
                content: `Error: ${error.message}`,
                timestamp: new Date(),
                status: 'error'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            setStatus(null);
        }
    }, [messages, profile, user, assistantConfig]);

    const clearChat = useCallback(() => {
        setMessages([]);
    }, []);

    return (
        <AIContext.Provider value={{ messages, isTyping, status, sendMessage, clearChat }}>
            {children}
        </AIContext.Provider>
    );
};

export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
};
