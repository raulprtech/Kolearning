
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function AnkiExportGuide() {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Exporta tu mazo de Anki como un archivo de 'Notas en Texto Plano (*.txt)' y luego cópialo y pégalo a continuación.
            </p>
            <Card className="bg-muted/50 p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Formato de exportación:</Label>
                        <Select defaultValue="txt" disabled>
                            <SelectTrigger className="w-[280px] bg-background">
                                <SelectValue placeholder="Notes in Plain Text (.txt)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="txt">Notas en Texto Plano (.txt)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Incluir:</Label>
                        <Select defaultValue="all" disabled>
                             <SelectTrigger className="w-[280px] bg-background">
                                <SelectValue placeholder="All Decks" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los mazos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 pt-2">
                         <div className="flex items-center space-x-2">
                            <Checkbox id="html" disabled />
                            <Label htmlFor="html" className="font-normal text-muted-foreground">Incluir HTML y referencias multimedia</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="tags" disabled />
                            <Label htmlFor="tags" className="font-normal text-muted-foreground">Incluir etiquetas</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="deckName" disabled />
                            <Label htmlFor="deckName" className="font-normal text-muted-foreground">Incluir nombre del mazo</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="notetype" disabled />
                            <Label htmlFor="notetype" className="font-normal text-muted-foreground">Incluir nombre del tipo de nota</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="uniqueId" disabled />
                            <Label htmlFor="uniqueId" className="font-normal text-muted-foreground">Incluir identificador único</Label>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="secondary" disabled>Cancelar</Button>
                        <Button variant="default" disabled>Exportar...</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
