
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
import { Loader2, Link as LinkIcon, Youtube } from "lucide-react";

interface UrlImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string) => void;
  isLoading: boolean;
  importType: 'url' | 'youtube' | null;
}

export function UrlImportDialog({ isOpen, onClose, onImport, isLoading, importType }: UrlImportDialogProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setUrl("");
    }
  }, [isOpen]);

  const handleImport = () => {
    if (url) {
      onImport(url);
    }
  };

  const title = importType === 'youtube' ? "Importar desde YouTube" : "Importar desde URL";
  const description = importType === 'youtube' 
    ? "Pega la URL del video de YouTube del que quieres extraer la transcripción."
    : "Pega la URL del sitio web del que quieres extraer el material de estudio. Koli leerá el contenido por ti.";
  const placeholder = importType === 'youtube' 
    ? "https://www.youtube.com/watch?v=..."
    : "https://ejemplo.com/articulo";
  const Icon = importType === 'youtube' ? Youtube : LinkIcon;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={placeholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleImport} disabled={isLoading || !url}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
