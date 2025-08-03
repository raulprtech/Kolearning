
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
  Check,
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

const steps = [
    {
        title: "Importa tu material",
        description: "Usa el icono '+' para subir tus apuntes, PDFs, o enlaces. Describe qué quieres aprender y por qué."
    },
    {
        title: "Interactúa con Koli",
        description: "Responde a las preguntas de Koli mientras procesa y atomiza tu contenido para entenderlo a fondo."
    },
    {
        title: "Verifica y ajusta",
        description: "Asegúrate de que todo el material se haya asimilado correctamente. Puedes añadir más si es necesario."
    }
]

export default function NewProjectPage() {
  return (
    <div className="flex flex-col flex-1">
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
           <div className="mt-12 max-w-4xl w-full text-left">
                <h2 className="text-xl font-headline text-center mb-6">Crea tu primer proyecto de estudio personalizado</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                                {index + 1}
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-8">
                    ¡Y listo! Con estos pasos, Koli generará tu proyecto de estudio personalizado y podrás empezar a aprender.
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
