
"use client";

import { useState } from "react";
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
import { Loader2, Link as LinkIcon } from "lucide-react";

interface UrlImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string) => void;
  isLoading: boolean;
}

export function UrlImportDialog({ isOpen, onClose, onImport, isLoading }: UrlImportDialogProps) {
  const [url, setUrl] = useState("");

  const handleImport = () => {
    if (url) {
      onImport(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar desde URL</DialogTitle>
          <DialogDescription>
            Pega la URL del sitio web del que quieres extraer el material de estudio. Koli leerá el contenido por ti.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="https://ejemplo.com/articulo"
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
