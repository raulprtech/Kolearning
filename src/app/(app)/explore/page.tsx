
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Book, Landmark, FlaskConical, Code, Music, Palette, Search, Filter, MessageSquareShare, Brain, Check } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import type { Project } from "@/contexts/ProjectContext";

// Temporary empty array until we implement public projects fetching from Supabase
const communityProjects: Project[] = [];

const projectIcons = {
  Book: Book,
  Landmark: Landmark,
  FlaskConical: FlaskConical,
  Code: Code,
  Music: Music,
  Palette: Palette,
};

export default function ExplorePage() {
  const { toast } = useToast();
  const { projects: userProjects, addProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [authorFilter, setAuthorFilter] = useState("Todos");

  // Combine community projects with user's public projects
  const userPublicProjects = userProjects.filter(p => p.isPublic);
  const allPublicProjects = [...communityProjects, ...userPublicProjects];

  // Deduplicate projects in case a user has a local copy of a community project
  const uniquePublicProjects = allPublicProjects.filter((project, index, self) =>
    index === self.findIndex((p) => (p.id === project.id))
  );

  const categories = ["Todos", ...new Set(uniquePublicProjects.map(p => p.category).filter(Boolean))];
  const authors = ["Todos", ...new Set(uniquePublicProjects.map(p => p.author).filter(Boolean))];

  const handleAddProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    addProject(project);
    toast({
      title: "¡Proyecto agregado!",
      description: `${project.title} ha sido añadido a tu lista.`,
    });
  };


  const filteredProjects = uniquePublicProjects.filter(project => {
    return (
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "Todos" || project.category === categoryFilter) &&
      (authorFilter === "Todos" || project.author === authorFilter)
    );
  });

  return (
    <div className="flex-1 flex flex-col p-6 bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-headline">Explorar</h1>
      </div>

      <div className="mb-8">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Busca por título o tema..."
            className="pl-10 h-12 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Categoría: <span className="font-bold ml-2">{categoryFilter}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories.map(cat => (
                <DropdownMenuItem key={cat} onClick={() => setCategoryFilter(cat!)}>
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Autor: <span className="font-bold ml-2">{authorFilter}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {authors.map(auth => (
                <DropdownMenuItem key={auth} onClick={() => setAuthorFilter(auth!)}>
                  {auth}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredProjects.length > 0 ? filteredProjects.map((project) => {
          const Icon = projectIcons[project.icon as keyof typeof projectIcons];
          return (
            <Link href={`/study/${project.id}`} key={project.id} className="block hover:bg-muted/30 transition-colors rounded-lg">
              <Card className="bg-card/50 flex flex-col h-full cursor-pointer border-transparent hover:border-primary">
                <CardHeader className="flex-row items-center gap-4">
                  {Icon && <Icon className="w-10 h-10 text-primary" />}
                  <div>
                    <CardTitle>{project.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.author}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription>{project.description}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={(e) => handleAddProject(e, project)}>
                    <Plus className="mr-2 h-4 w-4" /> Agregar a mis proyectos
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          );
        }) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-xl font-semibold">No se encontraron proyectos</h3>
            <p className="text-muted-foreground mt-2">Intenta ajustar tu búsqueda o filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
