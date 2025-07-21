
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
import type { Project, Flashcard } from '@/types';
import { getGeneratedProject } from '@/app/actions/decks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

async function getProjectDetails(projectId: string): Promise<(Project & { flashcards?: Flashcard[] }) | null> {
  // For generated projects, fetch from our temporary store
  if (projectId.startsWith('gen-')) {
    return getGeneratedProject(projectId);
  }
  return null;
}

const sessions = [
  { day: 'Día 1', topic: 'Variables', type: 'Opción Múltiple', status: 'Completada', link: '#' },
  { day: 'Día 2', topic: 'Funciones', type: 'Tutor AI', status: 'Continuar', link: '#' },
  { day: 'Día 3', topic: 'Funciones', type: 'Quiz de repaso', status: 'Desbloquear en 1 día', link: '#', disabled: true },
];

export default async function ProjectDetailsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  const project = await getProjectDetails(projectId);

  if (!project) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <p className="text-muted-foreground">
          The requested project could not be found.
        </p>
      </div>
    );
  }

  const knowledgeAtoms = project.flashcards || [];
  const knowledgeAtomsPreview = knowledgeAtoms.slice(0, 5);

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
                <p className="text-2xl font-bold">1</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/70">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-2 text-sm">CC ganados</p>
               <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-400" />
                <p className="text-2xl font-bold">5</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/70">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-2 text-sm">Dominio del tema</p>
               <div className="flex items-center gap-2">
                 <TrendingUp className="h-5 w-5 text-blue-400" />
                <p className="text-2xl font-bold">10%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Sesiones</h2>
            <Button variant="outline">Ver plan completo</Button>
          </div>
          <Card className="bg-card/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sesión</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session, index) => (
                  <TableRow key={index}>
                    <TableCell>{session.day}</TableCell>
                    <TableCell>{session.topic}</TableCell>
                    <TableCell>{session.type}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant={session.status === 'Completada' ? 'link' : 'default'} size="sm" disabled={session.disabled}>
                        <Link href={session.link} className={session.disabled ? 'text-muted-foreground' : ''}>{session.status}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
