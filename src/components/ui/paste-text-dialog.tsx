
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
import { Textarea } from "@/components/ui/textarea";

interface PasteTextDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => void;
}

export function PasteTextDialog({ isOpen, onClose, onImport }: PasteTextDialogProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setText("");
    }
  }, [isOpen]);

  const handleImport = () => {
    if (text) {
      onImport(text);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pegar texto como fuente</DialogTitle>
          <DialogDescription>
            Pega el contenido que quieres que Koli atomice.
          </DialogDescription>
        </DialogHeader>
        <Textarea 
            placeholder="Pega aquí tu material de estudio..."
            className="h-64 mt-4"
            value={text}
            onChange={(e) => setText(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleImport} disabled={!text.trim()}>
            Importar Texto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    