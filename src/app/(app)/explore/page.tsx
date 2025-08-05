
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
import { Plus, Book, Landmark, FlaskConical, Code, Music, Palette, Search, Filter } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";

const projectIcons = {
  Book: Book,
  Landmark: Landmark,
  FlaskConical: FlaskConical,
  Code: Code,
  Music: Music,
  Palette: Palette,
};

const allProjects = [
  {
    id: "4",
    title: "Programación en Python",
    description: "Aprende los fundamentos de Python, uno de los lenguajes más populares.",
    icon: "Code" as keyof typeof projectIcons,
    mastery: 0,
    category: "Tecnología",
    author: "Koli Academy",
    atoms: [
        { question: "¿Qué es una variable en Python?", answer: "Un contenedor para almacenar valores de datos." },
        { question: "Menciona 3 tipos de datos en Python", answer: "int (entero), str (cadena), bool (booleano)." }
    ],
    learningPath: [
        { session: 1, topic: "Variables y Tipos de Datos", sessionType: "Incursión" },
        { session: 2, topic: "Estructuras de Control", sessionType: "Incursión" },
    ],
    sources: [{ name: "python_intro.pdf", type: "Documento" }]
  },
  {
    id: "5",
    title: "Teoría Musical",
    description: "Desde escalas hasta acordes, domina la teoría detrás de la música.",
    icon: "Music" as keyof typeof projectIcons,
    mastery: 0,
    category: "Arte",
    author: "Comunidad",
     atoms: [
        { question: "¿Qué es una escala mayor?", answer: "Una escala diatónica con siete notas, caracterizada por su patrón de tonos y semitonos: T-T-S-T-T-T-S." },
        { question: "¿Qué es un acorde?", answer: "Un conjunto de tres o más notas que suenan simultáneamente." }
    ],
    learningPath: [
        { session: 1, topic: "Escalas y Tonalidades", sessionType: "Calibración" },
        { session: 2, topic: "Intervalos y Acordes", sessionType: "Incursión" },
    ],
    sources: [{ name: "music_theory_basics.docx", type: "Documento" }]
  },
  {
    id: "6",
    title: "Historia del Arte",
    description: "Un viaje a través de los movimientos artísticos más importantes.",
    icon: "Palette" as keyof typeof projectIcons,
    mastery: 0,
    category: "Humanidades",
    author: "Koli Academy",
    atoms: [
        { question: "¿Qué caracteriza al Impresionismo?", answer: "Pinceladas visibles, énfasis en la luz y el color, y la captura de un momento en el tiempo." },
        { question: "¿Quién pintó 'La noche estrellada'?", answer: "Vincent van Gogh en 1889." }
    ],
    learningPath: [
        { session: 1, topic: "Renacimiento", sessionType: "Incursión" },
        { session: 2, topic: "Impresionismo y Postimpresionismo", sessionType: "Incursión" },
    ],
    sources: [{ name: "art_history_101.pdf", type: "Documento" }]
  },
  {
    id: "7",
    title: "Introducción a React",
    description: "Construye interfaces de usuario modernas y reactivas.",
    icon: "Code" as keyof typeof projectIcons,
    mastery: 0,
    category: "Tecnología",
    author: "Comunidad",
    atoms: [
        { question: "¿Qué es JSX?", answer: "Una extensión de sintaxis para JavaScript que permite escribir HTML directamente dentro de React." },
        { question: "¿Qué es el 'state' en React?", answer: "Un objeto JavaScript que almacena los datos de un componente y determina cómo se renderiza y se comporta." }
    ],
    learningPath: [
        { session: 1, topic: "Componentes y Props", sessionType: "Incursión" },
        { session: 2, topic: "State y Ciclo de Vida", sessionType: "Incursión" },
    ],
    sources: [{ name: "react_docs_summary.txt", type: "Documento" }]
  },
  {
    id: "8",
    title: "Filosofía Griega",
    description: "Explora las ideas de Platón, Aristóteles y Sócrates.",
    icon: "Landmark" as keyof typeof projectIcons,
    mastery: 0,
    category: "Humanidades",
    author: "Koli Academy",
    atoms: [
        { question: "¿Qué es la 'Alegoría de la caverna' de Platón?", answer: "Una metáfora sobre la naturaleza de la realidad, el conocimiento y la educación filosófica." },
        { question: "¿Cuál es el método socrático?", answer: "Un método de diálogo que utiliza preguntas para estimular el pensamiento crítico y exponer las contradicciones en las creencias de uno." }
    ],
    learningPath: [
        { session: 1, topic: "Filósofos Presocráticos", sessionType: "Calibración" },
        { session: 2, topic: "Sócrates y Platón", sessionType: "Incursión" },
    ],
    sources: [{ name: "greek_philosophy.pdf", type: "Documento" }]
  },
];

const categories = ["Todos", ...new Set(allProjects.map(p => p.category))];
const authors = ["Todos", ...new Set(allProjects.map(p => p.author))];

export default function ExplorePage() {
  const { toast } = useToast();
  const { addProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [authorFilter, setAuthorFilter] = useState("Todos");

  const handleAddProject = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    addProject(project);
    toast({
      title: "¡Proyecto agregado!",
      description: `${project.title} ha sido añadido a tu lista.`,
    });
  };

  const filteredProjects = allProjects.filter(project => {
    return (
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "Todos" || project.category === categoryFilter) &&
      (authorFilter === "Todos" || project.author === authorFilter)
    );
  });

  return (
    <div className="flex-1 flex flex-col p-6 bg-background">
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
            <Filter className="h-5 w-5 text-muted-foreground"/>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Categoría: <span className="font-bold ml-2">{categoryFilter}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {categories.map(cat => (
                        <DropdownMenuItem key={cat} onClick={() => setCategoryFilter(cat)}>
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
                         <DropdownMenuItem key={auth} onClick={() => setAuthorFilter(auth)}>
                            {auth}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length > 0 ? filteredProjects.map((project) => {
          const Icon = projectIcons[project.icon];
          return (
            <Link href={`/projects/${project.id}`} key={project.id} className="block hover:bg-muted/30 transition-colors rounded-lg">
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
