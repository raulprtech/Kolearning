
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ProjectSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { title: string; description: string }) => void;
  isLoading: boolean;
  defaultValues: {
    title: string;
    description: string;
  };
}

export function ProjectSetupDialog({ isOpen, onClose, onSubmit, isLoading, defaultValues }: ProjectSetupDialogProps) {
  const [title, setTitle] = useState(defaultValues.title);
  const [description, setDescription] = useState(defaultValues.description);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultValues.title);
      setDescription(defaultValues.description);
    }
  }, [isOpen, defaultValues]);

  const handleSubmit = () => {
    onSubmit({ title, description });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Finalizar Proyecto</DialogTitle>
          <DialogDescription>
            Koli ha sugerido un nombre y descripción para tu proyecto. ¡Puedes ajustarlos si quieres!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Título
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading || !title}>
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Proyecto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
