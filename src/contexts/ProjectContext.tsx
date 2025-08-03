
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Book, Landmark, FlaskConical } from "lucide-react";

type Project = {
  id: string;
  title: string;
  mastery: number;
  tag: string;
  icon: string;
  notes?: string;
  bestStreak?: number;
  xpGained?: number;
};

type ProjectContextType = {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProjectIcon: (projectId: string, icon: string) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const initialProjects: Project[] = [
  {
    id: "1",
    title: "Física Cuántica",
    mastery: 85,
    tag: "STEM",
    icon: "Book",
  },
  {
    id: "2",
    title: "Historia de Roma",
    mastery: 62,
    tag: "Humanidades",
    icon: "Landmark",
  },
  {
    id: "3",
    title: "Química Orgánica",
    mastery: 45,
    tag: "STEM",
    icon: "FlaskConical",
  },
];

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const addProject = (project: Project) => {
    if (!projects.find(p => p.id === project.id)) {
      setProjects(prevProjects => [...prevProjects, project]);
    }
  };

  const updateProjectIcon = (projectId: string, icon: string) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, icon: icon } : p
      )
    );
  };
  
  return (
    <ProjectContext.Provider value={{ projects, addProject, updateProjectIcon }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
