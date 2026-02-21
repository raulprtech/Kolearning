"use client"

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ChevronDown, ChevronUp, Pencil, Save, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ZettelkastenNoteProps {
    atomQuestion: string;
    atomAnswer: string;
    existingNote?: string;
    onSaveNote: (note: string) => void;
}

export default function ZettelkastenNote({ atomQuestion, atomAnswer, existingNote, onSaveNote }: ZettelkastenNoteProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [note, setNote] = useState(existingNote || "");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateNote = useCallback(async () => {
        setIsGenerating(true);
        try {
            // Generate a Zettelkasten-style note from the atom
            const generatedNote = [
                `## ${atomQuestion}`,
                "",
                `**Concepto clave:** ${atomAnswer}`,
                "",
                `**Conexiones:**`,
                `- ¿Cómo se relaciona con lo que ya sé?`,
                `- ¿En qué contextos aplica este concepto?`,
                "",
                `**En mis palabras:**`,
                `(Escribe aquí tu comprensión personal)`,
                "",
                `**Preguntas abiertas:**`,
                `- ¿Qué más necesito investigar?`,
            ].join("\n");
            setNote(generatedNote);
            setIsEditing(true);
        } finally {
            setIsGenerating(false);
        }
    }, [atomQuestion, atomAnswer]);

    const handleSave = () => {
        onSaveNote(note);
        setIsEditing(false);
    };

    return (
        <Card className={cn(
            "mt-4 transition-all duration-300 border-amber-500/30",
            isExpanded ? "bg-amber-500/5" : "bg-card/50"
        )}>
            <CardHeader
                className="cursor-pointer py-3 px-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-amber-500" />
                        Nota Zettelkasten
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        {existingNote && (
                            <span className="text-xs text-amber-500/70 mr-2">Nota existente</span>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0 px-4 pb-4">
                    {!note && !isEditing ? (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Crea una nota personal para conectar este concepto con tu conocimiento previo.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleGenerateNote}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                                    Generar plantilla
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Escribir nota
                                </Button>
                            </div>
                        </div>
                    ) : isEditing ? (
                        <div className="space-y-3">
                            <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={8}
                                placeholder="Escribe tu nota Zettelkasten..."
                                className="text-sm bg-background"
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setNote(existingNote || ""); }}>
                                    Cancelar
                                </Button>
                                <Button size="sm" onClick={handleSave} disabled={!note.trim()}>
                                    <Save className="h-4 w-4 mr-1" />
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="prose prose-sm max-w-none dark:prose-invert text-sm whitespace-pre-wrap bg-background/50 rounded-md p-3">
                                {note}
                            </div>
                            <div className="flex justify-end">
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Editar
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
