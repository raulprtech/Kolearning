
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
          <DialogTitle>Paste text as source</DialogTitle>
          <DialogDescription>
            Paste the content you want the Tutor to atomize.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Paste your study material here..."
          className="h-64 mt-4"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={!text.trim()}>
            Import Text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

