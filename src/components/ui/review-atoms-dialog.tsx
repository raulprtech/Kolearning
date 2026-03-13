import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Atom } from "@/contexts/ProjectContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Brain, FileCheck } from "lucide-react";

interface ReviewAtomsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    atoms: Atom[];
    sourceName: string;
}

export function ReviewAtomsDialog({
    isOpen,
    onClose,
    onAccept,
    atoms,
    sourceName
}: ReviewAtomsDialogProps) {
    if (!atoms || atoms.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Revisión de Átomos: {sourceName}
                    </DialogTitle>
                    <DialogDescription>
                        Se generaron {atoms.length} átomos de conocimiento de este documento. Revisa los conceptos antes de integrarlos a tu plan de estudio.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 border rounded-md p-4 mt-2">
                    <Accordion type="single" collapsible className="w-full">
                        {atoms.map((atom, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-left font-medium">
                                    <span className="flex gap-2 items-center">
                                        <span className="flex-shrink-0 bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                            {index + 1}
                                        </span>
                                        {atom.question}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="bg-muted/30 p-4 rounded-md mt-2 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1 text-primary">Respuesta Core</h4>
                                        <p className="text-sm">{atom.answer}</p>
                                    </div>
                                    
                                    {atom.incorrectAnswers && atom.incorrectAnswers.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-sm mb-1 text-destructive/80">Distractores</h4>
                                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                                {atom.incorrectAnswers.map((distractor, idx) => (
                                                    <li key={idx}>{distractor}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollArea>

                <DialogFooter className="mt-4 sm:justify-between items-center bg-muted/50 p-2 rounded-lg border">
                    <div className="text-sm text-muted-foreground flex items-center gap-2 px-2">
                        <FileCheck className="h-4 w-4" />
                        Al aceptar, estos átomos formarán nuevas sesiones en tu plan.
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Descartar
                        </Button>
                        <Button onClick={onAccept}>
                            Integrar {atoms.length} Átomos
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
