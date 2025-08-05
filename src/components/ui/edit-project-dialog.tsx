
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
import { Textarea } from "@/components/ui/textarea";
import { Project } from "@/contexts/ProjectContext";
import { Label } from "./label";

interface EditProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSave: (title: string, description: string) => void;
}

export function EditProjectDialog({ isOpen, onClose, project, onSave }: EditProjectDialogProps) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);

  useEffect(() => {
    setTitle(project.title);
    setDescription(project.description);
  }, [project, isOpen]);

  const handleSave = () => {
    onSave(title, description);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Detalles del Proyecto</DialogTitle>
          <DialogDescription>
            Realiza cambios en el título y la descripción de tu proyecto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div>
                <Label htmlFor="title">Título del Proyecto</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    