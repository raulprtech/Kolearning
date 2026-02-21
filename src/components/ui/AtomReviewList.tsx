"use client";

import React, { useState, useMemo } from 'react';
import { Atom } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit2, Check, X, Search, ChevronLeft, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AtomReviewListProps {
    atoms: Atom[];
    onFinalize: (finalAtoms: Atom[]) => void;
    onBack: () => void;
    title: string;
}

export function AtomReviewList({ atoms: initialAtoms, onFinalize, onBack, title }: AtomReviewListProps) {
    const [atoms, setAtoms] = useState<Atom[]>(initialAtoms);
    const [search, setSearch] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Atom | null>(null);

    const filteredAtoms = useMemo(() => {
        return atoms.filter(a =>
            a.question.toLowerCase().includes(search.toLowerCase()) ||
            a.answer.toLowerCase().includes(search.toLowerCase())
        );
    }, [atoms, search]);

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setEditForm({ ...atoms[index] });
    };

    const handleSaveEdit = () => {
        if (editingIndex !== null && editForm) {
            const newAtoms = [...atoms];
            newAtoms[editingIndex] = editForm;
            setAtoms(newAtoms);
            setEditingIndex(null);
            setEditForm(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditForm(null);
    };

    const handleDelete = (index: number) => {
        const newAtoms = atoms.filter((_, i) => i !== index);
        setAtoms(newAtoms);
        if (editingIndex === index) {
            setEditingIndex(null);
            setEditForm(null);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center p-4 md:p-8 bg-background overflow-hidden h-full">
            <div className="w-full max-w-4xl flex flex-col h-full gap-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={onBack} className="gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Volver
                    </Button>
                    <div className="text-center">
                        <h1 className="text-2xl font-headline font-bold">Revisar Átomos</h1>
                        <p className="text-sm text-muted-foreground">{title}</p>
                    </div>
                    <Button onClick={() => onFinalize(atoms)} className="gap-2 bg-primary">
                        <Save className="h-4 w-4" />
                        Finalizar Proyecto
                    </Button>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden bg-card/50">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="text-lg">
                                Conceptos Generados ({atoms.length})
                            </CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar preguntas..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                {filteredAtoms.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No se encontraron preguntas que coincidan con la búsqueda.
                                    </div>
                                ) : (
                                    filteredAtoms.map((atom, index) => {
                                        const realIndex = atoms.findIndex(a => a === atom);
                                        const isEditing = editingIndex === realIndex;

                                        return (
                                            <div
                                                key={realIndex}
                                                className={`group border rounded-lg p-4 transition-colors ${isEditing ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-muted/30'
                                                    }`}
                                            >
                                                {isEditing ? (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase text-muted-foreground">Pregunta</label>
                                                            <Input
                                                                value={editForm?.question}
                                                                onChange={(e) => setEditForm(prev => prev ? { ...prev, question: e.target.value } : null)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase text-muted-foreground">Respuesta</label>
                                                            <Textarea
                                                                value={editForm?.answer}
                                                                onChange={(e) => setEditForm(prev => prev ? { ...prev, answer: e.target.value } : null)}
                                                                className="min-h-[100px]"
                                                            />
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                                                <X className="h-4 w-4 mr-1" /> Cancelar
                                                            </Button>
                                                            <Button size="sm" onClick={handleSaveEdit}>
                                                                <Check className="h-4 w-4 mr-1" /> Guardar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <p className="font-semibold text-primary/90">{atom.question}</p>
                                                            <p className="text-sm text-muted-foreground leading-relaxed">{atom.answer}</p>
                                                        </div>
                                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(realIndex)}>
                                                                <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(realIndex)}>
                                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground">
                    Revisa que las preguntas sean correctas y relevantes. Puedes editarlas o eliminarlas antes de crear el plan de estudio.
                </p>
            </div>
        </div>
    );
}
