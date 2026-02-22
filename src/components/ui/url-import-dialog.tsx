
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
import { Loader2, Link as LinkIcon } from "lucide-react";

interface UrlImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string) => void;
  isLoading: boolean;
}

export function UrlImportDialog({ isOpen, onClose, onImport, isLoading }: UrlImportDialogProps) {
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

  const title = "Import from URL";
  const description = "Paste the URL of the website you want to extract study material from. The Tutor will read the content for you.";
  const placeholder = "https://example.com/article";
  const Icon = LinkIcon;


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
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleImport} disabled={isLoading || !url}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

