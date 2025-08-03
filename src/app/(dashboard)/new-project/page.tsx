
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FileText,
  X,
  Send,
  Paperclip,
  Link as LinkIcon,
  Youtube
} from "lucide-react";

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files!)]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const getFileIcon = (fileType: string) => {
    // For now, only a generic file icon is returned.
    // This could be expanded to return different icons based on the file type.
    return <FileText className="h-6 w-6 text-primary" />;
  };


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
          {selectedFiles.length > 0 && (
            <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedFiles.map(file => (
                <div key={file.name} className="bg-card/80 rounded-lg p-3 flex flex-col gap-2 relative">
                    <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="text-xs text-foreground truncate">{file.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{file.type.split('/')[1] || 'Archivo'}</p>
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeFile(file.name)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <Input
              placeholder="Pregúntale a Koli..."
              className="w-full h-12 rounded-full pl-12 pr-14 bg-card border-border"
            />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top">
                    <DropdownMenuItem onClick={handleUploadClick}>
                      <Paperclip className="mr-2 h-4 w-4" />
                      <span>Subir archivos</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      <span>Importar desde enlace</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Youtube className="mr-2 h-4 w-4" />
                      <span>Importar desde Youtube</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button variant="ghost" size="icon">
                  <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
