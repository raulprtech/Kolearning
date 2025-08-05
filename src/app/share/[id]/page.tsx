
"use client";

import { useState } from 'react';
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { publicProjects, useProjects } from '@/contexts/ProjectContext';
import { Logo } from '@/components/icons/logo';
import { BookCopy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SharedProjectPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { addProject } = useProjects();
    const [copied, setCopied] = useState(false);

    const projectId = params.id as string;
    // In a real app, you'd fetch this from a database.
    // For now, we'll check both user projects and public projects.
    const project = publicProjects.find(p => p.id === projectId);

    if (!project) {
        return (
            <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center p-4">
                <h1 className="text-3xl font-bold font-headline">Proyecto no encontrado</h1>
                <p className="text-muted-foreground mt-2">El enlace puede ser incorrecto o el proyecto ya no está compartido.</p>
                <Button onClick={() => router.push('/')} className="mt-6">Ir a la página principal</Button>
            </div>
        );
    }
    
    const handleCopyToMyProjects = () => {
        // Here we just add the project, but in a real scenario
        // it would first trigger the customization dialog.
        addProject(project);
        setCopied(true);
        toast({
            title: "¡Proyecto copiado!",
            description: `"${project.title}" ha sido añadido a tus proyectos.`,
        });
        setTimeout(() => router.push(`/projects/${project.id}`), 1000);
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="flex items-center justify-between p-4 md:px-8 border-b">
                <div className="flex items-center gap-3">
                    <Logo className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold font-headline">
                        Kolearning
                    </h1>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center text-center px-4">
                <Card className="w-full max-w-2xl bg-card/50">
                    <CardHeader>
                        <p className="text-sm text-muted-foreground">Estás viendo un proyecto compartido</p>
                        <CardTitle className="text-3xl font-bold font-headline">{project.title}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            Este proyecto contiene <span className="font-bold text-foreground">{project.atoms.length}</span> átomos de conocimiento. Cópialo a tu cuenta para empezar a estudiar.
                        </p>
                        <Button size="lg" onClick={handleCopyToMyProjects} disabled={copied}>
                            {copied ? (
                                <>
                                    <Check className="mr-2 h-5 w-5" />
                                    ¡Copiado! Redirigiendo...
                                </>
                            ) : (
                                <>
                                    <BookCopy className="mr-2 h-5 w-5"/>
                                    Copiar a mis Proyectos
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

    