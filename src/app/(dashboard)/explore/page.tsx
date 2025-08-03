
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Book, Landmark, FlaskConical, Code, Music, Palette } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";

const projectIcons = {
  Book: Book,
  Landmark: Landmark,
  FlaskConical: FlaskConical,
  Code: Code,
  Music: Music,
  Palette: Palette,
};

const availableProjects = [
  {
    id: "4",
    title: "Programación en Python",
    description: "Aprende los fundamentos de Python, uno de los lenguajes más populares.",
    icon: "Code" as keyof typeof projectIcons,
    mastery: 0,
  },
  {
    id: "5",
    title: "Teoría Musical",
    description: "Desde escalas hasta acordes, domina la teoría detrás de la música.",
    icon: "Music" as keyof typeof projectIcons,
    mastery: 0,
  },
  {
    id: "6",
    title: "Historia del Arte",
    description: "Un viaje a través de los movimientos artísticos más importantes.",
    icon: "Palette" as keyof typeof projectIcons,
    mastery: 0,
  },
];

export default function ExplorePage() {
  const { toast } = useToast();
  const { addProject } = useProjects();

  const handleAddProject = (project: any) => {
    addProject(project);
    toast({
      title: "¡Proyecto agregado!",
      description: `${project.title} ha sido añadido a tu lista.`,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableProjects.map((project) => {
          const Icon = projectIcons[project.icon];
          return (
            <Card key={project.id} className="bg-card/50 flex flex-col">
              <CardHeader className="flex-row items-center gap-4">
                {Icon && <Icon className="w-10 h-10 text-primary" />}
                <div>
                  <CardTitle>{project.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription>{project.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleAddProject(project)}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar a mis proyectos
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
