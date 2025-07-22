
'use client';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Globe,
  Star,
  Award,
  TrendingUp,
  Trash2,
  Book,
  FileText,
  Link as LinkIcon,
  Pencil,
} from 'lucide-react';
import type { Project } from '@/types';
import { getGeneratedProject, getAllProjects } from '@/app/actions/projects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

function ProjectDetailsView({ project }: { project: Project }) {
  const knowledgeAtoms = project.flashcards || [];
  const knowledgeAtomsPreview = knowledgeAtoms.slice(0, 5);
  const studyPlan = project.studyPlan?.plan || [];

  return (
    <div className="container mx-auto py-8">
      <div className="bg-card/50 p-6 sm:p-8 rounded-xl shadow-lg border">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-8 w-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold">{project.title}</h1>
          </div>
          <Badge variant="outline" className="border-dashed">{project.category}</Badge>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Card className="bg-card/70">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-2 text-sm">Mejor Racha</p>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/70">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-2 text-sm">CC ganados</p>
               <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-400" />
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/70">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-2 text-sm">Dominio del tema</p>
               <div className="flex items-center gap-2">
                 <TrendingUp className="h-5 w-5 text-blue-400" />
                <p className="text-2xl font-bold">0%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Plan de Estudios</h2>
          </div>
          <Card className="bg-card/70">
            {studyPlan.length > 0 ? (
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sesión</TableHead>
                    <TableHead>¿Qué aprenderás en esta sesión?</TableHead>
                    <TableHead>Tipo de Sesión</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studyPlan.map((session, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{session.topic}</TableCell>
                      <TableCell>{session.sessionType}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild={index === 0} variant={index === 0 ? 'default' : 'secondary'} size="sm" disabled={index > 0}>
                           {index === 0 ? (
                            <Link href={`/aprender?project=${project.slug}`}>
                                Empezar
                            </Link>
                           ) : (
                             <span>Bloqueado</span>
                           )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <CardContent className="p-6 text-center text-muted-foreground">
                Este proyecto aún no tiene un plan de estudios.
              </CardContent>
            )}
          </Card>
        </section>

        {/* Knowledge Atoms */}
        <section className="mb-10">
           <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Átomos de conocimiento</h2>
               <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Ver todos ({knowledgeAtoms.length})</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Todos los Átomos de Conocimiento</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <Table>
                      <TableBody>
                        {knowledgeAtoms.map(atom => (
                          <TableRow key={atom.id}>
                            <TableCell className="font-medium w-1/3 align-top">{atom.question}</TableCell>
                            <TableCell className="text-muted-foreground w-2/3 align-top">{atom.answer}</TableCell>
                            <TableCell className="w-auto align-top">
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                            <TableCell className="w-auto align-top">
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
           </div>
           <Card className="bg-card/70">
            <Table>
                <TableBody>
                    {knowledgeAtomsPreview.map(atom => (
                        <TableRow key={atom.id}>
                            <TableCell className="font-medium w-1/3">{atom.question}</TableCell>
                            <TableCell className="text-muted-foreground w-2/3">{atom.answer}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
           </Card>
        </section>
      </div>
    </div>
  );
}

export default function ProjectDetailsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    async function loadProject() {
      const projectSlug = params.projectId;
      const projects = await getAllProjects();
      const foundProject = projects.find(p => p.slug === projectSlug);
      if (foundProject) {
        setProject(foundProject);
      } else {
        notFound();
      }
    }
    loadProject();
  }, [params.projectId]);

  if (!project) {
    return <div>Cargando...</div>;
  }
  
  return <ProjectDetailsView project={project} />;
}
