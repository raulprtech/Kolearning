
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
import { useProjects } from '@/contexts/ProjectContext';
import { Logo } from '@/components/icons/logo';
import { BookCopy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SharedProjectPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { projects: userProjects, addProject } = useProjects();
    const [copied, setCopied] = useState(false);

    const projectId = params.id as string;

    // Check both public community projects and the user's own projects (in a real app, this would be a single DB query)
    const project = userProjects.find(p => p.id === projectId);


    if (!project) {
        return (
            <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center p-4">
                <h1 className="text-3xl font-bold font-headline">Project not found</h1>
                <p className="text-muted-foreground mt-2">The link might be incorrect or the project is no longer shared.</p>
                <Button onClick={() => router.push('/')} className="mt-6">Go to Home</Button>
            </div>
        );
    }

    const handleCopyToMyProjects = () => {
        // Create a new ID for the copied project to avoid duplicates
        const slug = project.title
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
        const newProjectId = `${slug}-copy-${Date.now()}`;

        const newProject = { ...project, id: newProjectId, isPublic: false }; // Cloned projects are private by default

        addProject(newProject);
        setCopied(true);
        toast({
            title: "Project copied!",
            description: `"${project.title}" has been added to your projects.`,
        });
        setTimeout(() => router.push(`/study/${newProjectId}`), 1000);
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
                        <p className="text-sm text-muted-foreground">You are viewing a shared project</p>
                        <CardTitle className="text-3xl font-bold font-headline">{project.title}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            This project contains <span className="font-bold text-foreground">{project.atoms.length}</span> knowledge atoms. Copy it to your account to start studying.
                        </p>
                        <Button size="lg" onClick={handleCopyToMyProjects} disabled={copied}>
                            {copied ? (
                                <>
                                    <Check className="mr-2 h-5 w-5" />
                                    Copied! Redirecting...
                                </>
                            ) : (
                                <>
                                    <BookCopy className="mr-2 h-5 w-5" />
                                    Copy to my Projects
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
