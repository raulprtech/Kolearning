
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import { useProjects } from "@/contexts/ProjectContext";
import { Book, Landmark, FlaskConical, Code, Music, Palette } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const projectIcons: { [key: string]: React.ElementType } = {
  Book,
  Landmark,
  FlaskConical,
  Code,
  Music,
  Palette,
};

export default function DashboardPage() {
    const { projects } = useProjects();

  return (
    <div className="flex flex-col flex-1 p-6">
      <main className="flex-1 flex flex-col">
        <Card className="bg-card/50 mb-6">
            <CardHeader className="flex flex-row items-center gap-4">
                <KoliAvatar className="h-16 w-16"/>
                <div>
                    <CardTitle className="font-headline">Reporte Diario de Koli</CardTitle>
                    <CardDescription>
                        Koli sugiere tu próxima sesión de estudio para maximizar tu retención.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="mb-4">
                    Basado en tu progreso en <strong>Física Cuántica</strong>, te recomiendo una sesión de <Link href="/study/1" className="text-primary hover:underline font-bold">Refuerzo</Link> para consolidar los conceptos clave.
                </p>
                <Link href="/study/1">
                    <Button>Comenzar Sesión de Refuerzo</Button>
                </Link>
            </CardContent>
        </Card>
        
        <div>
            <h2 className="text-xl font-semibold mb-4">Mis Proyectos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => {
                    const Icon = projectIcons[project.icon]
                    return (
                        <Link href={`/projects/${project.id}`} key={project.id}>
                            <Card className="bg-card/50 hover:border-primary transition-colors h-full flex flex-col">
                                <CardHeader className="flex-row items-center gap-4">
                                    {Icon && <Icon className="w-8 h-8 text-primary" />}
                                    <CardTitle>{project.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-muted-foreground">Dominio</span>
                                        <span className="text-sm font-bold">{project.mastery}%</span>
                                    </div>
                                    <Progress value={project.mastery} className="h-2" />
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
      </main>
    </div>
  );
}
