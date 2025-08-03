"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  BookOpen,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Compass
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-foreground">
              Kolearning
            </h1>
          </div>
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
          <Button variant="outline" className={`w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
            <Compass className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Explorar Proyectos</span>}
          </Button>

           <h3 className={`mt-6 mb-2 text-sm font-semibold text-muted-foreground ${isSidebarOpen ? 'px-2' : 'text-center'}`}>
              {isSidebarOpen ? 'Proyectos' : 'Mis'}
            </h3>
          <div className="flex flex-col gap-2">
            {projects.map((project) => (
              <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
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
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
