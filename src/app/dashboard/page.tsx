
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  FileText,
  Globe,
  ImageIcon,
  HelpCircle,
  Layers,
  Sheet,
  Wand2,
  Notebook,
} from "lucide-react";

const importOptions = [
  { icon: Notebook, label: "Apuntes" },
  { icon: FileText, label: "PDF" },
  { icon: Globe, label: "Página Web" },
  { icon: ImageIcon, label: "Imagen" },
  { icon: HelpCircle, label: "Quizlet" },
  { icon: Layers, label: "Anki" },
  { icon: Sheet, label: "Hojas de Cálculo" },
  { icon: Wand2, label: "Cizmo" },
];


export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center justify-end p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button>Acceder</Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-md">
            <KoliAvatar className="h-24 w-24 mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              Hola, soy Koli
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Tu asistente de IA personal. ¿En qué te puedo ayudar a aprender hoy?
            </p>
          </div>
        </div>

        <div className="w-full max-w-2xl mt-auto p-4">
          <div className="relative">
            <Input
              placeholder="Pregúntale a Koli..."
              className="w-full h-12 rounded-full pl-6 pr-12 bg-card border-border"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
               <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px] bg-card/95 backdrop-blur-sm">
                  <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Importación Mágica</DialogTitle>
                    <DialogDescription>
                      Selecciona desde dónde quieres importar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                    {importOptions.map((option, index) => (
                      <Button
                        key={index}
                        variant={index === 0 ? "default" : "outline"}
                        className="flex flex-col h-24 gap-2 items-center justify-center"
                      >
                        <option.icon className="h-6 w-6" />
                        <span>{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
