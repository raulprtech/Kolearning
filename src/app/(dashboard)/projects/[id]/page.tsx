
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Globe, Eye, Pencil, Trash2, MoreVertical, Book, Landmark, FlaskConical, Code, Music, Palette, Play } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";


const projectIcons: { [key: string]: React.ElementType } = {
  Book,
  Landmark,
  FlaskConical,
  Globe,
  Code,
  Music,
  Palette,
};

function ProjectDetails() {
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const slug = params.id as string;
  const { projects, updateProjectIcon } = useProjects();

  const project = projects.find(p => p.id === slug);

  if (!project) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
            <h1 className="text-2xl font-bold">Proyecto no encontrado</h1>
            <p className="text-muted-foreground">El proyecto que buscas no existe o ha sido eliminado.</p>
            <Button onClick={() => router.push('/')} className="mt-4">Volver al Dashboard</Button>
        </div>
    )
  }
  
  const Icon = projectIcons[project.icon] || Book;

  const handleIconChange = (iconKey: string) => {
    updateProjectIcon(project.id, iconKey);
    setIsIconSelectorOpen(false);
  };

  return (
    <ScrollArea className="h-full">
    <div className="flex-1 flex flex-col p-6 bg-background">
      <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsIconSelectorOpen(true)} className="p-2 rounded-full hover:bg-muted transition-colors">
                <Icon className="w-10 h-10 text-primary" />
            </button>
            <div>
                <h1 className="text-3xl font-bold font-headline text-foreground">{project.title}</h1>
                <div className="flex gap-2 mt-1">
                    {project.categories?.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                </div>
            </div>
          </div>
          <Dialog open={isIconSelectorOpen} onOpenChange={setIsIconSelectorOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                  <DropdownMenuItem>Agregar Conocimiento</DropdownMenuItem>
                  <DropdownMenuItem>Recalibrar</DropdownMenuItem>
                  <DropdownMenuItem>Archivar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsIconSelectorOpen(true)}>Cambiar icono</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Elige un icono para tu proyecto</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-4 gap-4 py-4">
                {Object.entries(projectIcons).map(([key, IconComponent]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="flex flex-col h-24 gap-2 items-center justify-center"
                    onClick={() => handleIconChange(key)}
                  >
                    <IconComponent className="h-8 w-8 text-primary" />
                    <span className="text-xs">{key}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Dominio del Tema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{project.mastery}%</div>
            <Progress value={project.mastery} className="h-2"/>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Átomos de Conocimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{project.atoms?.length || 0}</div>
          </CardContent>
        </Card>
         <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Próxima Sesión</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="font-bold text-lg text-primary">Sesión de Calibración</p>
             <p className="text-sm text-muted-foreground">Recomendada para hoy</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle>Plan de Conquista</CardTitle>
                    <CardDescription>Tu ruta estratégica para dominar {project.title}.</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-headline prose-headings:text-primary">
                    <div dangerouslySetInnerHTML={{ __html: project.sessions?.replace(/\n/g, '<br />') || ''}} />
                    <Button className="mt-4 not-prose"><Play className="mr-2"/>Comenzar Próxima Sesión</Button>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle>Fuentes de Conocimiento</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableBody>
                        {project.sources?.map((source, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <p className="font-medium">{source.name}</p>
                                    <p className="text-sm text-muted-foreground">{source.type}</p>
                                </TableCell>
                                <TableCell className="text-right">
                                     <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                     <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="mt-6">
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle>Átomos de Conocimiento ({project.atoms?.length || 0})</CardTitle>
                <CardDescription>La base fundamental de tu proyecto de estudio.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Pregunta</TableHead>
                        <TableHead className="w-[50%]">Respuesta</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {project.atoms?.map((atom, index) => (
                        <TableRow key={index}>
                        <TableCell className="font-medium align-top">{atom.question}</TableCell>
                        <TableCell className="text-muted-foreground align-top">{atom.answer}</TableCell>
                        <TableCell className="text-right align-top">
                            <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

    </div>
    </ScrollArea>
  );
}

export default function ProjectDetailsPage() {
    return (
        <ProjectDetails />
    )
}
