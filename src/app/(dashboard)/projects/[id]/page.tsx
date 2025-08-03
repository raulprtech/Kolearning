
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Globe, Eye, Pencil, Trash2, CheckCircle, Lock, MoreVertical, Book, Landmark, FlaskConical, Code, Music, Palette } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";


const projectIcons = {
  Book: Book,
  Landmark: Landmark,
  FlaskConical: FlaskConical,
  Globe: Globe,
  Code: Code,
  Music: Music,
  Palette: Palette,
};

function ProjectDetails() {
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const params = useParams();
  const slug = params.id as string;
  const { projects, updateProjectIcon } = useProjects();


  const project = projects.find(p => p.title.toLowerCase().replace(/\s+/g, '-') === slug) || {
    id: "not-found",
    title: "Proyecto no encontrado",
    notes: "notes",
    bestStreak: 0,
    xpGained: 0,
    mastery: 0,
    icon: "Globe",
    tag: "default",
  };
  
  const Icon = projectIcons[project.icon as keyof typeof projectIcons];

  const handleIconChange = (iconKey: string) => {
    if(project.id !== "not-found") {
        updateProjectIcon(project.id, iconKey);
    }
    setIsIconSelectorOpen(false);
  };


  const sessions = [
    {
      day: "Día 1",
      type: "Calibración",
      questions: "Flashcards",
      duration: "20 min",
      status: "Completado",
    },
    {
      day: "Día 2",
      type: "Refuerzo",
      questions: "Opción múltiple",
      duration: "30 min",
      status: "Continuar",
    },
    {
      day: "Día 3",
      type: "Dominio",
      questions: "Preguntas abiertas",
      duration: "25 min",
      status: "Desbloquease en 1 día",
    },
  ];

  const knowledgeAtoms = [
    { variable: "Variables", source: "Falta de interpretabi...", },
    { variable: "Funciones", source: "Pipeline multimodal...", },
    { variable: "Bucles", source: "Fusión tardía...", },
  ];

    const sources = [
    { name: "JavaScript en el mundo", type: "Libro" },
    { name: "Por qué JavaScript mejora", type: "Hoja de blog" },
    ];


  return (
    <div className="flex-1 flex flex-col p-6 bg-background">
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {Icon && <Icon className="w-8 h-8 text-primary" />}
            <div>
                <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
                <p className="text-muted-foreground">{project.notes}</p>
            </div>
          </div>
          <Dialog open={isIconSelectorOpen} onOpenChange={setIsIconSelectorOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                  <DropdownMenuItem>Agregar Conocimiento</DropdownMenuItem>
                  <DropdownMenuItem>Recalibrar</DropdownMenuItem>
                  <DropdownMenuItem>Archivar</DropdownMenuItem>
                  <DropdownMenuItem>Cambiar privacidad</DropdownMenuItem>
                  <DropdownMenuItem>Cambiar categoría</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsIconSelectorOpen(true)}>Cambiar icono</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Elige un icono para tu proyecto</DialogTitle>
                <DialogDescription>
                  Selecciona un icono que represente tu proyecto.
                </DialogDescription>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Mejor Racha</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{project.bestStreak}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">XP ganados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{project.xpGained}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Dominio del tema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{project.mastery}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sesiones</h2>
          <Button variant="link">Ver hoja completa</Button>
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
              {sessions.map((session, index) => (
                <TableRow key={index}>
                  <TableCell>{session.day}</TableCell>
                  <TableCell>
                    <Badge variant={session.type === 'Calibración' ? 'default' : session.type === 'Refuerzo' ? 'secondary' : 'destructive'} className="capitalize">
                      {session.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{session.questions}</TableCell>
                  <TableCell>{session.duration}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {session.status === "Completado" && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {session.status === "Continuar" && <Button size="sm">Continuar</Button>}
                      {session.status.startsWith("Desbloquease") && <> <Lock className="w-4 h-4" /> <span>{session.status}</span> </>}
                      {session.status === "Completado" && <span>{session.status}</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Átomos de conocimiento</h2>
          <Button variant="link">Ver todas (15)</Button>
        </div>
        <Card className="bg-card/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variables</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead>Ver</TableHead>
                <TableHead>Editar</TableHead>
                <TableHead>Eliminar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {knowledgeAtoms.map((atom, index) => (
                <TableRow key={index}>
                  <TableCell>{atom.variable}</TableCell>
                  <TableCell>{atom.source}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Fuentes</h2>
        <Card className="bg-card/50">
             <Table>
                <TableBody>
                {sources.map((source, index) => (
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
        </Card>
      </div>
    </div>
  );
}

export default function ProjectDetailsPage() {
    return (
        <ProjectDetails />
    )
}
