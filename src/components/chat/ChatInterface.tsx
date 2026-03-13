"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '@/contexts/AIContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Send, Sparkles, User, Bot, ExternalLink, Plus, FileCheck, Rocket, Paperclip, X, GraduationCap, ChevronRight, Palette, Cat, Brain, Flame, BrainCircuit, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { HookRegistry } from '@/core/domain/services/HookRegistry';
import { UISlot } from '@/components/connectors/UISlot';

const ArticleCard = ({ article }: { article: any }) => (
    <Card className="p-4 mt-2 bg-muted/30 border-primary/20 hover:border-primary/50 transition-colors">
        <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm leading-tight">{article.title}</h4>
                    {article.source && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 font-medium bg-primary/5 text-primary/70 border-primary/10">
                            {article.source}
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                    {article.authors?.join(', ')} {article.year ? `(${article.year})` : ''}
                </p>
            </div>
            <div className="flex gap-2">
                {article.url && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                )}
                <Button variant="outline" size="icon" className="h-8 w-8 text-primary">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
        {article.abstract && (
            <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-normal">
                {article.abstract}
            </p>
        )}
    </Card>
);

const ProjectProposalCard = ({ project, onAccept }: { project: any, onAccept: () => void }) => (
    <Card className="p-6 mt-2 bg-primary/5 border-primary/30 space-y-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
                <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h4 className="font-bold text-base leading-tight">Propuesta de Proyecto</h4>
                <p className="text-xs text-muted-foreground">Listo para organizar tu aprendizaje</p>
            </div>
        </div>

        <div className="space-y-2">
            <h5 className="font-bold text-sm">{project.title}</h5>
            <p className="text-xs text-muted-foreground leading-relaxed">{project.description}</p>
        </div>

        <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-[10px] font-normal">
                Fuente: {project.sourceType}
            </Badge>
        </div>

        <Button onClick={onAccept} className="w-full gap-2 py-6 text-base font-bold shadow-lg shadow-primary/20">
            <FileCheck className="h-5 w-5" />
            Crear este Proyecto Ahora
        </Button>
    </Card>
);

const ProjectCard = ({ project, onStudy }: { project: any, onStudy: () => void }) => (
    <Card className="p-4 mt-2 bg-background border-primary/20 hover:border-primary/50 transition-all group">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-bold text-sm leading-tight truncate">{project.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {project.mastery}% Dominio
                        </Badge>
                        <p className="text-[10px] text-muted-foreground truncate">
                            {project.description}
                        </p>
                    </div>
                </div>
            </div>
            <Button size="sm" onClick={onStudy} className="shrink-0 gap-1 font-bold">
                Estudiar <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    </Card>
);

const ScheduledTaskCard = ({ task }: { task: any }) => (
    <Card className="p-4 mt-2 bg-primary/5 border-dashed border-primary/40 flex items-center gap-4">
        <div className="p-2 bg-primary/20 rounded-full animate-pulse">
            <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">Acción Agéntica</span>
                <Badge variant="outline" className="text-[9px] h-4">{task.schedule}</Badge>
            </div>
            <p className="text-sm font-medium mt-0.5">{task.description || 'Tarea programada'}</p>
        </div>
        <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px]">Agendado</Badge>
    </Card>
);

interface ChatInterfaceProps {
    onAction?: (action: string, data: any) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onAction }) => {
    const { messages, sendMessage, isTyping, status, startNewChat } = useAI();
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const [input, setInput] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollArea) {
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        }
    }, [messages, isTyping]);

    // Dynamic Assistant Icon mapping
    const assistantConfig = React.useMemo(() => {
        if (!profile?.additional_info) return null;
        try {
            const info = JSON.parse(profile.additional_info);
            return info.assistant || null;
        } catch (e) {
            return null;
        }
    }, [profile]);

    const assistantName = assistantConfig?.name || 'Kolearning';
    const userName = profile?.name || 'Estudiante';

    // Icon mapping logic
    const AssistantIcon = React.useMemo(() => {
        const iconName = assistantConfig?.avatar?.toLowerCase() || 'bot';
        switch (iconName) {
            case 'creative': return Palette;
            case 'friendly': return Cat;
            case 'wise': return Brain;
            case 'energetic': return Flame;
            case 'tech': return BrainCircuit;
            case 'focused': return Target;
            case 'fast': return Zap;
            default: return Bot;
        }
    }, [assistantConfig]);

    const handleSend = async () => {
        if ((!input.trim() && attachedFiles.length === 0) || isTyping) return;

        // Filter the user message before sending
        let msg = HookRegistry.applyFilters('filter_user_message', input);
        const files = [...attachedFiles];

        setInput('');
        setAttachedFiles([]);

        // Notify conectores that a message is about to be sent
        HookRegistry.doAction('on_message_sent', { content: msg, files });

        // Pass file names to give context to the orchestrator
        const fileNames = files.map(f => f.name);
        await sendMessage(msg, fileNames.length > 0 ? fileNames : undefined);

        if (files.length > 0) {
            // Signal file upload to the listener if needed
            onAction?.('FILES_UPLOADED', { files });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (name: string) => {
        setAttachedFiles(prev => prev.filter(f => f.name !== name));
    };

    return (
        <Card className="flex flex-col h-full max-w-4xl mx-auto w-full border-none shadow-none bg-transparent">
            <div className="flex-1 overflow-hidden relative">
                <ScrollArea ref={scrollRef} className="h-full px-4 py-8">
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <AssistantIcon className="w-12 h-12 text-primary" />
                                </div>
                                <h2 className="text-3xl font-bold font-headline">
                                    {t('chat.welcome_title', { name: userName }) || `Hola ${userName}, ¿en qué puedo ayudarte hoy?`}
                                </h2>
                                <p className="text-muted-foreground max-w-md">
                                    {t('chat.welcome_desc', { assistant: assistantName }) || `Soy ${assistantName}, tu orquestador de aprendizaje. Puedo buscar artículos, crear proyectos o ayudarte a estudiar.`}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full">
                                    {[
                                        "Busca artículos científicos",
                                        "Resume un documento",
                                        "Crea un nuevo proyecto",
                                        "Ayúdame a estudiar"
                                    ].map(suggestion => (
                                        <Button
                                            key={suggestion}
                                            variant="outline"
                                            className="justify-start h-auto py-3 px-4 text-left"
                                            onClick={() => sendMessage(suggestion)}
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <Avatar className={cn("h-8 w-8 shrink-0", msg.role === 'user' ? "bg-primary" : "bg-muted")}>
                                    {msg.role === 'user' ? (
                                        <AvatarFallback><User className="w-4 h-4 text-primary-foreground" /></AvatarFallback>
                                    ) : (
                                        <AvatarFallback><AssistantIcon className="w-4 h-4 text-primary" /></AvatarFallback>
                                    )}
                                </Avatar>
                                <div className={cn(
                                    "p-4 rounded-2xl max-w-[80%]",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-card border rounded-tl-none"
                                )}>
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                                    {msg.metadata?.toolResults?.map((tool: any, idx: number) => {
                                        if (tool.toolName === 'searchArticles') {
                                            return (
                                                <div key={idx} className="mt-4 space-y-2">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal uppercase tracking-wider bg-primary/10 text-primary border-none">
                                                            Resultados de Búsqueda
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {tool.output?.slice(0, 10).map((article: any, aIdx: number) => (
                                                            <ArticleCard key={aIdx} article={article} />
                                                        ))}
                                                        {tool.output?.length > 10 && (
                                                            <p className="text-[10px] text-center text-muted-foreground italic">
                                                                + {tool.output.length - 10} artículos más encontrados
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (tool.toolName === 'createProject') {
                                            return (
                                                <ProjectProposalCard
                                                    key={idx}
                                                    project={tool.input}
                                                    onAccept={() => onAction?.('CREATE_PROJECT', tool.input)}
                                                />
                                            );
                                        }

                                        if (tool.toolName === 'searchDataBox') {
                                            return (
                                                <div key={idx} className="mt-4 space-y-2">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal uppercase tracking-wider bg-primary/10 text-primary border-none">
                                                            Tus Proyectos (Data Box)
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {tool.output?.map((project: any, pIdx: number) => (
                                                            <ProjectCard
                                                                key={pIdx}
                                                                project={project}
                                                                onStudy={() => onAction?.('START_STUDY_SESSION', { projectId: project.id })}
                                                            />
                                                        ))}
                                                        {tool.output?.length === 0 && (
                                                            <p className="text-xs text-muted-foreground italic px-2">
                                                                No se encontraron proyectos guardados coincidentes.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (tool.toolName === 'startStudySession') {
                                            return (
                                                <div key={idx} className="mt-4 flex justify-center">
                                                    <Button variant="outline" size="sm" onClick={() => onAction?.('START_STUDY_SESSION', tool.input)} className="gap-2">
                                                        <Sparkles className="h-4 w-4" /> Iniciar Sesión para "{tool.input.projectName}"
                                                    </Button>
                                                </div>
                                            );
                                        }

                                        if (tool.toolName === 'scheduleTask') {
                                            return <ScheduledTaskCard key={idx} task={tool.input} />;
                                        }

                                        if (tool.toolName === 'searchDeepMemory') {
                                            return (
                                                <div key={idx} className="mt-4 space-y-2 bg-muted/20 p-3 rounded-lg border border-primary/10">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Sparkles className="h-3 w-3 text-primary" />
                                                        <span className="text-[10px] font-bold text-primary uppercase">Conexión de Aprendizaje Transversal</span>
                                                    </div>
                                                    {tool.output?.map((atom: any, aIdx: number) => (
                                                        <div key={aIdx} className="text-xs border-l-2 border-primary/30 pl-3 py-1 mb-2">
                                                            <p className="font-bold text-primary/80">{atom.projectName}</p>
                                                            <p className="text-muted-foreground italic">"{atom.question}"</p>
                                                            {atom.similarity && <span className="text-[9px] text-primary/50">Similitud: {Math.round(atom.similarity * 100)}%</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-start gap-4">
                                <Avatar className="h-8 w-8 bg-muted">
                                    <AvatarFallback><AssistantIcon className="w-4 h-4 text-primary" /></AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <div className="bg-card border p-4 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                    {status && (
                                        <p className="text-[10px] text-muted-foreground px-1 animate-pulse italic">
                                            {status}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            <div className="p-4 bg-background/80 backdrop-blur pb-8">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* UI Injected from Connectors */}
                    <UISlot slotId="chat_sidebar" className="px-2" />

                    {attachedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-2">
                            {attachedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-primary/10 text-primary text-[10px] font-medium px-3 py-1.5 rounded-full border border-primary/20 animate-in zoom-in-50">
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button onClick={() => removeFile(file.name)} className="hover:text-destructive transition-colors">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative group">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            multiple
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute left-2 top-2 h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        >
                            <Paperclip className="w-5 h-5" />
                        </Button>
                        <Input
                            placeholder={t('chat.input_placeholder') || "Describe what you want to achieve..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            className="h-14 pl-14 pr-14 rounded-2xl border-2 focus-visible:ring-primary/20 bg-card group-hover:border-primary/50 transition-colors shadow-sm"
                        />
                        <Button
                            size="icon"
                            onClick={handleSend}
                            aria-label="Send message"
                            disabled={(!input.trim() && attachedFiles.length === 0) || isTyping}
                            className="absolute right-2 top-2 h-10 w-10 rounded-xl shadow-lg shadow-primary/20"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground">
                        Kolearning AI can orchestrate your learning. Data Box and Study sections are always available in the sidebar.
                    </p>
                </div>
            </div>
        </Card>
    );
};
