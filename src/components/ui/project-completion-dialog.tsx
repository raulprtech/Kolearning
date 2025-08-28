
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Project } from "@/contexts/ProjectContext";
import { Award, Target, BrainCircuit, CheckCircle } from "lucide-react";

interface ProjectCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onFinish: () => void;
}

export function ProjectCompletionDialog({ isOpen, onClose, project, onFinish }: ProjectCompletionDialogProps) {
    if (!project) return null;

    const accuracy = project.totalAnswers && project.correctAnswers && project.totalAnswers > 0
        ? Math.round((project.correctAnswers / project.totalAnswers) * 100)
        : 100;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
            <div className="flex flex-col items-center text-center">
                <Award className="h-16 w-16 text-yellow-400 mb-4" />
                <DialogTitle className="text-3xl font-headline">¡Proyecto Completado!</DialogTitle>
                <DialogDescription>
                    ¡Felicidades! Has dominado "{project.title}".
                </DialogDescription>
            </div>
            </DialogHeader>
            <div className="my-6">
                <h3 className="text-lg font-semibold text-center mb-4">Resumen Final</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                     <div className="bg-card/50 p-4 rounded-lg">
                        <Target className="mx-auto h-8 w-8 text-green-400 mb-2" />
                        <p className="text-2xl font-bold">{accuracy}%</p>
                        <p className="text-sm text-muted-foreground">Precisión Final</p>
                    </div>
                     <div className="bg-card/50 p-4 rounded-lg">
                        <BrainCircuit className="mx-auto h-8 w-8 text-blue-400 mb-2" />
                        <p className="text-2xl font-bold">{project.bestStreak}</p>
                        <p className="text-sm text-muted-foreground">Mejor Racha</p>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground text-center mt-6">
                    Koli programará sesiones de repaso para ayudarte a retener este conocimiento a largo plazo.
                </p>
            </div>
            <DialogFooter className="sm:justify-center">
            <Button onClick={onFinish} size="lg">
                <CheckCircle className="mr-2 h-5 w-5" />
                Genial, ¡gracias!
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
