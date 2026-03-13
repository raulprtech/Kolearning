import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { BrainCircuit, Loader2 } from "lucide-react";

export type ProcessingStage = {
    stage: string;
    message: string;
    details?: string;
    progress: number;
};

interface ProcessingSourceDialogProps {
    isOpen: boolean;
    sourceName: string;
    currentStage: ProcessingStage | null;
}

export function ProcessingSourceDialog({
    isOpen,
    sourceName,
    currentStage
}: ProcessingSourceDialogProps) {
    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-primary animate-pulse" />
                        Procesando Documento
                    </DialogTitle>
                    <DialogDescription>
                        Kolearning está analizando "{sourceName}". Este proceso puede tomar varios minutos. Por favor no cierres esta ventana.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Progress value={currentStage?.progress || 0} className="w-full" />
                    <div className="flex flex-col gap-1 items-center justify-center text-center">
                        <span className="font-semibold text-sm flex items-center gap-2">
                            {currentStage?.progress === 100 ? (
                                <BrainCircuit className="h-4 w-4 text-green-500" />
                            ) : (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {currentStage?.message || "Inicializando sistema..."}
                        </span>
                        {currentStage?.details && (
                            <span className="text-xs text-muted-foreground whitespace-pre-line text-left bg-muted/50 p-2 rounded w-full border font-mono mt-2">
                                {currentStage.details}
                            </span>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
