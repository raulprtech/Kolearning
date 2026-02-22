import React, { useEffect, useState } from 'react';
import { Atom, AtomPayload } from '@/contexts/ProjectContext';
import { Label } from './label';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Button } from './button';
import { Trash, Plus } from 'lucide-react';

interface PolymorphicAtomEditorProps {
    atom: Partial<Atom>;
    onChange: (atom: Partial<Atom>) => void;
}

export const PolymorphicAtomEditor: React.FC<PolymorphicAtomEditorProps> = ({ atom, onChange }) => {
    const [currentAtom, setCurrentAtom] = useState<Partial<Atom>>({
        type: 'text_card',
        question: '',
        answer: '',
        payload: {},
        ...atom
    });

    useEffect(() => {
        setCurrentAtom({
            type: 'text_card',
            question: '',
            answer: '',
            payload: {},
            ...atom
        });
    }, [atom]);

    const handleChange = (field: keyof Atom, value: any) => {
        const updated = { ...currentAtom, [field]: value };
        setCurrentAtom(updated);
        onChange(updated);
    };

    const handlePayloadChange = (field: keyof AtomPayload, value: any) => {
        const updatedPayload = { ...(currentAtom.payload || {}), [field]: value };
        const updated = { ...currentAtom, payload: updatedPayload };
        setCurrentAtom(updated);
        onChange(updated);
    };

    const handleTypeChange = (value: string) => {
        const updated = { ...currentAtom, type: value };
        setCurrentAtom(updated);
        onChange(updated);
    };

    const addPair = () => {
        const pairs = currentAtom.payload?.pairs || [];
        handlePayloadChange('pairs', [...pairs, { id: Date.now().toString(), term: '', definition: '' }]);
    };

    const updatePair = (index: number, field: 'term' | 'definition', value: string) => {
        const pairs = [...(currentAtom.payload?.pairs || [])];
        pairs[index] = { ...pairs[index], [field]: value };
        handlePayloadChange('pairs', pairs);
    };

    const removePair = (index: number) => {
        const pairs = [...(currentAtom.payload?.pairs || [])];
        pairs.splice(index, 1);
        handlePayloadChange('pairs', pairs);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Tipo de Contenido (Átomo)</Label>
                <Select value={currentAtom.type || 'text_card'} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de átomo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text_card">📝 Tarjeta de Texto (Tradicional)</SelectItem>
                        <SelectItem value="video_review">📽️ Revisión de Video</SelectItem>
                        <SelectItem value="mini_game">🎮 Reto / Mini-Juego</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {currentAtom.type === 'text_card' && (
                <>
                    <div className="space-y-2">
                        <Label>Pregunta central</Label>
                        <Textarea
                            placeholder="Escribe la pregunta o concepto a repasar..."
                            value={currentAtom.question || ''}
                            onChange={(e) => handleChange('question', e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Respuesta esperada</Label>
                        <Textarea
                            placeholder="Escribe la respuesta ideal..."
                            value={currentAtom.answer || ''}
                            onChange={(e) => handleChange('answer', e.target.value)}
                            rows={4}
                        />
                    </div>
                </>
            )}

            {currentAtom.type === 'video_review' && (
                <>
                    <div className="space-y-2">
                        <Label>URL del Video (YouTube)</Label>
                        <Input
                            placeholder="https://youtube.com/watch?v=..."
                            value={currentAtom.payload?.videoUrl || ''}
                            onChange={(e) => handlePayloadChange('videoUrl', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Segundo de Inicio</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={currentAtom.payload?.startTime || ''}
                                onChange={(e) => handlePayloadChange('startTime', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Segundo de Fin</Label>
                            <Input
                                type="number"
                                placeholder="30"
                                value={currentAtom.payload?.endTime || ''}
                                onChange={(e) => handlePayloadChange('endTime', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Pregunta post-video</Label>
                        <Input
                            placeholder="¿Qué explica el presentador en este fragmento?"
                            value={currentAtom.question || ''}
                            onChange={(e) => handleChange('question', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Puntos clave esperados (Respuesta)</Label>
                        <Textarea
                            placeholder="El usuario debe mencionar..."
                            value={currentAtom.answer || ''}
                            onChange={(e) => handleChange('answer', e.target.value)}
                            rows={3}
                        />
                    </div>
                </>
            )}

            {currentAtom.type === 'mini_game' && (
                <>
                    <div className="space-y-2">
                        <Label>Instrucción del Juego</Label>
                        <Input
                            placeholder="Ej: Une los conceptos clave con sus definiciones"
                            value={currentAtom.question || ''}
                            onChange={(e) => handleChange('question', e.target.value)}
                        />
                        <div className="text-xs text-muted-foreground">La respuesta (JSON serializado) se gestionará automáticamente.</div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <Label>Pares de Relación (Concepto {'->'} Definición)</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addPair} className="h-8">
                                <Plus className="h-4 w-4 mr-1" /> Agregar Par
                            </Button>
                        </div>

                        {(currentAtom.payload?.pairs || []).map((pair: any, index: number) => (
                            <div key={pair.id} className="flex gap-2 items-start">
                                <div className="space-y-2 flex-1">
                                    <Input
                                        placeholder="Concepto (Ej. Mitocondria)"
                                        value={pair.term}
                                        onChange={(e) => updatePair(index, 'term', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 flex-[2]">
                                    <Input
                                        placeholder="Definición (Ej. Planta de energía de la célula)"
                                        value={pair.definition}
                                        onChange={(e) => updatePair(index, 'definition', e.target.value)}
                                    />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removePair(index)} className="shrink-0 text-destructive">
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {(!currentAtom.payload?.pairs || currentAtom.payload.pairs.length === 0) && (
                            <div className="text-center py-4 text-sm text-muted-foreground border rounded-md border-dashed">
                                Agrega al menos 2 pares para generar un reto interactivo.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
