import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, MoreVertical, BrainCircuit, BookOpen } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const projects = [
    {
      id: "1",
      title: "Física Cuántica",
      mastery: 85,
      nextSession: "Revisar Conceptos Débiles",
      tag: "STEM",
    },
    {
      id: "2",
      title: "Historia de Roma",
      mastery: 62,
      nextSession: "Nuevos Átomos: Las Guerras Púnicas",
      tag: "Humanidades",
    },
    {
      id: "3",
      title: "Química Orgánica",
      mastery: 45,
      nextSession: "Brecha Detectada: Alquenos",
      tag: "STEM",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            Kolearning
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost">Arsenal Comunitario</Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-headline text-foreground">
              Panel Estratégico
            </h2>
            <p className="text-muted-foreground">
              Tu centro de mando para el dominio del conocimiento.
            </p>
          </div>

          <Card className="mb-8 bg-card/30 shadow-lg border-primary/20 border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-headline text-xl">
                <BrainCircuit className="text-primary h-6 w-6" />
                Reporte Diario de Koli
              </CardTitle>
              <CardDescription>Tu misión de hoy, Aprendiz.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Concéntrate en{" "}
                <strong className="text-primary">Física Cuántica</strong>. Se
                recomienda una sesión de 'Brecha Detectada' para solidificar tu
                comprensión de la dualidad onda-partícula.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/study/1" passHref>
                <Button>Iniciar Sesión</Button>
              </Link>
            </CardFooter>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="flex flex-col bg-card/30 hover:border-primary/50 transition-all shadow-sm"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-headline">
                        {project.title}
                      </CardTitle>
                      <CardDescription>
                        Siguiente: {project.nextSession}
                      </CardDescription>
                    </div>
                     <Badge variant="secondary">{project.tag}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Dominio</span>
                    <span className="font-bold text-primary">
                      {project.mastery}%
                    </span>
                  </div>
                  <Progress value={project.mastery} className="h-2" />
                </CardContent>
                <CardFooter className="gap-2">
                  <Link href={`/study/${project.id}`} passHref className="w-full">
                    <Button variant="outline" className="w-full">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Estudiar
                    </Button>
                  </Link>
                   <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                </CardFooter>
              </Card>
            ))}
            <Card className="flex flex-col items-center justify-center border-2 border-dashed bg-transparent hover:border-primary transition-all text-muted-foreground hover:text-primary">
              <Button
                variant="ghost"
                className="h-full w-full flex-col gap-2 py-10"
              >
                <PlusCircle className="h-8 w-8" />
                <span>Crear Nuevo Proyecto</span>
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
