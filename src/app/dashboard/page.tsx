
"use client";

import { useState } from "react";
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
import {
  Plus,
  BookOpen,
  Menu,
  Search,
  MessageSquare,
  Settings,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { KoliAvatar } from "@/components/icons/koli-avatar";

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const projects = [
    {
      id: "1",
      title: "Física Cuántica",
      mastery: 85,
      tag: "STEM",
    },
    {
      id: "2",
      title: "Historia de Roma",
      mastery: 62,
      tag: "Humanidades",
    },
    {
      id: "3",
      title: "Química Orgánica",
      mastery: 45,
      tag: "STEM",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={`flex flex-col bg-card/30 transition-all duration-300 ${
          isSidebarOpen ? "w-72" : "w-20"
        } p-4 border-r border-border`}
      >
        <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} mb-8`}>
          <Link href="/" className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-foreground">
              Kolearning
            </h1>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          <Button variant="outline" className={`w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
            <Plus className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Nuevo Proyecto</span>}
          </Button>

           <h3 className={`mt-6 mb-2 text-sm font-semibold text-muted-foreground ${isSidebarOpen ? 'px-2' : 'text-center'}`}>
              {isSidebarOpen ? 'Proyectos' : 'Mis'}
            </h3>
          <div className="flex flex-col gap-2">
            {projects.map((project) => (
              <Link href={`/study/${project.id}`} key={project.id}>
                <div className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted ${isSidebarOpen ? '' : 'justify-center'}`}>
                   <BookOpen className="h-5 w-5 text-primary" />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium">{project.title}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-auto">
          <Button variant="ghost" className={`w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
            <Settings className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Configuración</span>}
          </Button>
        </div>
      </aside>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b border-border">
           <div className="flex items-center gap-4">
             <KoliAvatar className="h-8 w-8" />
             <h2 className="text-xl font-bold">Koli</h2>
           </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost">Arsenal Comunitario</Button>
            <Button>Acceder</Button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center p-4">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center text-center max-w-md">
              <KoliAvatar className="h-24 w-24 mb-6" />
              <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
                Hola, soy Koli
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Tu asistente de IA personal. ¿En qué te puedo ayudar a aprender hoy?
              </p>
            </div>
          </div>

          <div className="w-full max-w-2xl mt-auto p-4">
             <div className="relative">
                <Input
                placeholder="Pregúntale a Koli..."
                className="w-full h-12 rounded-full pl-6 pr-20 bg-card border-border"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Plus className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Mic className="h-5 w-5" />
                    </Button>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
