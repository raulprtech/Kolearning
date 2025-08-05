
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Project } from "@/contexts/ProjectContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Label } from "./label";
import { Switch } from "./switch";
import { Copy, Check } from "lucide-react";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onTogglePublic: (projectId: string, isPublic: boolean) => void;
}

export function ShareDialog({ isOpen, onClose, project, onTogglePublic }: ShareDialogProps) {
    const [isPublic, setIsPublic] = useState(!!project.isPublic);
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        setShareUrl(`${window.location.origin}/share/${project.id}`);
      }
      setIsPublic(!!project.isPublic);
    }, [project, isOpen]);

    const handlePublicToggle = (checked: boolean) => {
        setIsPublic(checked);
        onTogglePublic(project.id, checked);
    }
    
    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Compartir "{project.title}"</DialogTitle>
            <DialogDescription>
                Elige cómo quieres compartir tu proyecto con otros.
            </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="private" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="private">Enlace Privado</TabsTrigger>
                    <TabsTrigger value="public">Público</TabsTrigger>
                </TabsList>
                <TabsContent value="private" className="py-4">
                    <div className="space-y-2">
                        <Label htmlFor="share-url">Enlace para compartir</Label>
                        <div className="flex items-center gap-2">
                            <Input id="share-url" value={shareUrl} readOnly />
                            <Button size="icon" onClick={handleCopy}>
                                {copied ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Cualquiera con este enlace podrá ver y copiar tu proyecto.</p>
                    </div>
                </TabsContent>
                <TabsContent value="public" className="py-4">
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>Publicar en Explorar</Label>
                            <p className="text-xs text-muted-foreground">
                                Permite que otros usuarios descubran y usen tu proyecto.
                            </p>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={handlePublicToggle}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </DialogContent>
        </Dialog>
    );
}

    