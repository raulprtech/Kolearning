
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Compass,
  Book,
  Landmark,
  FlaskConical,
  Code,
  Music,
  Palette
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Progress } from "@/components/ui/progress";
import { ProjectProvider, useProjects } from "@/contexts/ProjectContext";

const SidebarContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { projects } = useProjects();
  
  const projectIcons = {
    Book: Book,
    Landmark: Landmark,
    FlaskConical: FlaskConical,
    Code: Code,
    Music: Music,
    Palette: Palette,
  };

  return (
    <aside
      className={`flex flex-col bg-card/30 transition-all duration-300 ${
        isSidebarOpen ? "w-72" : "w-20"
      } p-4 border-r border-border`}
    >
      <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} mb-8`}>
        <Link href="/" className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline">
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

      <nav className="flex flex-col gap-2 flex-1">
        <Link href="/dashboard" passHref>
          <Button variant="outline" className={`w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
            <Plus className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Nuevo Proyecto</span>}
          </Button>
        </Link>
        <Link href="/dashboard/explore" passHref>
          <Button variant="outline" className={`w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
            <Compass className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Explorar Proyectos</span>}
          </Button>
        </Link>

        <h3 className={`mt-6 mb-2 text-sm font-semibold text-muted-foreground ${isSidebarOpen ? 'px-2' : 'text-center'}`}>
          {isSidebarOpen ? 'Proyectos' : 'Mis'}
        </h3>
        <div className="flex flex-col gap-4">
          {projects.map((project) => {
            const Icon = projectIcons[project.icon as keyof typeof projectIcons];
            return (
              <Link href={`/dashboard/projects/${project.id}`} key={project.id} className={`p-2 rounded-md hover:bg-muted ${isSidebarOpen ? '' : 'flex justify-center'}`}>
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
                  {isSidebarOpen && (
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{project.title}</span>
                        <span className="text-xs text-muted-foreground">{project.mastery}%</span>
                      </div>
                      <Progress value={project.mastery} className="h-1.5" />
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="mt-auto">
        <Button variant="ghost" className={`w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
          <Settings className="h-4 w-4" />
          {isSidebarOpen && <span className="ml-2">Configuración</span>}
        </Button>
      </div>
    </aside>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider>
      <div className="flex h-screen bg-background text-foreground">
        <SidebarContent />
        <div className="flex-1 flex flex-col overflow-auto">{children}</div>
      </div>
    </ProjectProvider>
  );
}
