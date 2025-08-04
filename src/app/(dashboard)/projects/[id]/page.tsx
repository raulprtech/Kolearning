
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
import { Globe, Eye, Pencil, Trash2, MoreVertical, Book, Landmark, FlaskConical, Code, Music, Palette, Play, Plus, Lock, CheckCircle, Share2 } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


const projectIcons: { [key: string]: React.ElementType } = {
  Book,
  Landmark,
  FlaskConical,
  Globe,
  Code,
  Music,
  Palette,
};

const mockSessions = [
    { day: "Día 1", type: "Calibración", questions: "Flashcards", duration: "20 min", status: "Completed" },
    { day: "Día 2", type: "Refuerzo", questions: "Opción múltiple", duration: "30 min", status: "Continue" },
    { day: "Día 3", type: "Dominio", questions: "Preguntas abiertas", duration: "25 min", status: "Locked" },
]

function ProjectDetails() {
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const slug = params.id as string;
  const { projects, updateProjectIcon, updateProjectDetails } = useProjects();
  
  const project = projects.find(p => p.id === slug);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableTitle, setEditableTitle] = useState(project?.title || "");
  const [editableDescription, setEditableDescription] = useState(project?.description || "");

  if (!project) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
            <h1 className="text-2xl font-bold">Proyecto no encontrado</h1>
            <p className="text-muted-foreground">El proyecto que buscas no existe o ha sido eliminado.</p>
            <Button onClick={() => router.push('/')} className="mt-4">Volver al Dashboard</Button>
        </div>
    )
  }
  
  const Icon = projectIcons[project.icon] || Globe;

  const handleIconChange = (iconKey: string) => {
    updateProjectIcon(project.id, iconKey);
    setIsIconSelectorOpen(false);
  };

  const handleSaveDetails = () => {
      updateProjectDetails(project.id, editableTitle, editableDescription);
      setIsEditing(false);
  }
  
  const getSessionStatus = (status: string) => {
      switch(status) {
          case 'Completed':
              return <div className="flex items-center gap-2 text-green-400"><CheckCircle className="h-4 w-4"/>Completado</div>
          case 'Continue':
              return <Button size="sm">Continuar</Button>
          case 'Locked':
              return <div className="flex items-center gap-2 text-muted-foreground"><Lock className="h-4 w-4"/> Desbloquease en 1 día</div>
          default:
              return null;
      }
  }

  const getSessionBadge = (type: string) => {
      switch(type) {
          case 'Calibración':
              return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">{type}</Badge>
          case 'Refuerzo':
              return <Badge variant="secondary">{type}</Badge>
          case 'Dominio':
              return <Badge variant="destructive">{type}</Badge>
          default:
              return <Badge variant="outline">{type}</Badge>;
      }
  }

  return (
    <ScrollArea className="h-full">
    <div className="flex-1 flex flex-col p-6 bg-background">
      <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4 flex-1">
            <button onClick={() => setIsIconSelectorOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors mt-1">
                <Icon className="w-8 h-8 text-primary" />
            </button>
            <div className="flex-1">
                {isEditing ? (
                     <div className="flex flex-col gap-2 max-w-2xl">
                        <Input 
                            value={editableTitle} 
                            onChange={(e) => setEditableTitle(e.target.value)}
                            className="text-2xl font-bold font-headline h-auto p-0 border-0 focus-visible:ring-0"
                        />
                        <Textarea 
                            value={editableDescription} 
                            onChange={(e) => setEditableDescription(e.target.value)}
                            className="text-sm text-muted-foreground p-0 border-0 focus-visible:ring-0"
                            rows={1}
                        />
                    </div>
                ) : (
                    <div>
                        <h1 className="text-2xl font-bold font-headline text-foreground max-w-2xl">{project.title}</h1>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
                 <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button onClick={handleSaveDetails}>Guardar</Button>
                </>
            ) : (
                <>
                    <Button>
                        <Play className="mr-2 h-4 w-4" />
                        Estudiar
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Editar Proyecto</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                            <Share2 className="mr-2 h-4 w-4" />
                            <span>Compartir</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar Proyecto</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
          </div>
      </div>

      <Dialog open={isIconSelectorOpen} onOpenChange={setIsIconSelectorOpen}>
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
      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card/50">
                <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Mejor Racha</p>
                    <p className="text-4xl font-bold">1</p>
                </CardContent>
            </Card>
             <Card className="bg-card/50">
                <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">XP ganados</p>
                    <p className="text-4xl font-bold">0</p>
                </CardContent>
            </Card>
             <Card className="bg-card/50">
                <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Dominio del tema</p>
                    <p className="text-4xl font-bold">{project.mastery}%</p>
                </CardContent>
            </Card>
        </div>

        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Sesiones</h2>
                <Button variant="outline">Ver hoja completa</Button>
            </div>
            <Card className="bg-card/50">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sesión</TableHead>
                            <TableHead>Tipo de Sesión</TableHead>
                            <TableHead>Preguntas</TableHead>
                            <TableHead>Duración</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockSessions.map(session => (
                             <TableRow key={session.day}>
                                <TableCell>{session.day}</TableCell>
                                <TableCell>{getSessionBadge(session.type)}</TableCell>
                                <TableCell>{session.questions}</TableCell>
                                <TableCell>{session.duration}</TableCell>
                                <TableCell>{getSessionStatus(session.status)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
        
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Átomos de conocimiento</h2>
                <Button variant="outline">Ver todas ({project.atoms?.length || 0})</Button>
            </div>
            <Card className="bg-card/50">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Término</TableHead>
                        <TableHead>Definición</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {project.atoms?.slice(0, 4).map((atom, index) => (
                        <TableRow key={index}>
                        <TableCell className="font-medium align-top max-w-xs truncate">{atom.question}</TableCell>
                        <TableCell className="text-muted-foreground align-top max-w-sm truncate">{atom.answer}</TableCell>
                        <TableCell className="text-right align-top">
                             <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-2"/>
                                Ver
                            </Button>
                            <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                             <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </Card>
        </div>

        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Fuentes</h2>
            </div>
            <Card className="bg-card/50">
                <Table>
                    <TableBody>
                    {project.sources?.map((source, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <p className="font-medium">{source.name}</p>
                                <p className="text-sm text-muted-foreground">{source.type}</p>
                            </TableCell>
                            <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4 mr-2"/>
                                    Ver
                                </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
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
