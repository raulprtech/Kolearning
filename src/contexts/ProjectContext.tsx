
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Atom = {
  question: string;
  answer: string;
}

type Source = {
    name: string;
    type: string;
}

type Session = {
  day: string;
  type: string;
  questions: string;
  duration: string;
  status: 'Completed' | 'Continue' | 'Locked';
}

type Project = {
  id: string;
  title: string;
  description: string;
  mastery: number;
  icon: string;
  categories: string[];
  atoms: Atom[];
  sessions: Session[];
  sources: Source[];
  fullLearningPlanMarkdown?: string;
};

type ProjectContextType = {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProjectIcon: (projectId: string, icon: string) => void;
  updateProjectDetails: (projectId: string, title: string, description: string) => void;
  addSessionsToProject: (projectId: string, newSessions: Omit<Session, 'status' | 'day'>[]) => void;
  updateAtom: (projectId: string, atomIndex: number, updatedAtom: Atom) => void;
  deleteAtom: (projectId: string, atomIndex: number) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const initialProjects: Project[] = [
  {
    id: "1",
    title: "Física Cuántica",
    description: "Un curso introductorio a los principios de la mecánica cuántica.",
    mastery: 85,
    icon: "Book",
    categories: ["Ciencia", "Física"],
    atoms: [
        { question: "¿Qué es la dualidad onda-partícula?", answer: "Es el concepto de la mecánica cuántica según el cual cada partícula puede ser descrita en términos no solo de partículas, sino también de ondas." },
        { question: "¿Qué es el principio de incertidumbre de Heisenberg?", answer: "Establece la imposibilidad de que determinados pares de magnitudes físicas observables y complementarias sean conocidas con precisión arbitraria." }
    ],
    sessions: [
        { day: "Día 1", type: "Calibración", questions: "Flashcards", duration: "20 min", status: "Completed" },
        { day: "Día 2", type: "Refuerzo", questions: "Opción múltiple", duration: "30 min", status: "Continue" },
        { day: "Día 3", type: "Dominio", questions: "Preguntas abiertas", duration: "25 min", status: "Locked" },
    ],
    sources: [ {name: "Quantum_Physics_for_Dummies.pdf", type: "Documento"} ]
  },
  {
    id: "2",
    title: "Historia de Roma",
    description: "Explora el ascenso y caída del Imperio Romano.",
    mastery: 62,
    icon: "Landmark",
    categories: ["Humanidades", "Historia"],
    atoms: [
        { question: "¿Quién fue el primer emperador de Roma?", answer: "César Augusto (nacido como Cayo Octavio)." },
        { question: "¿Qué fueron las Guerras Púnicas?", answer: "Una serie de tres guerras libradas entre Roma y Cartago desde el 264 a.C. hasta el 146 a.C." }
    ],
    sessions: [
        { day: "Día 1", type: "Incursión", questions: "Flashcards", duration: "25 min", status: "Continue" },
    ],
    sources: [ {name: "The_History_of_Rome.pdf", type: "Documento"} ]
  },
  {
    id: "3",
    title: "Química Orgánica",
    description: "Domina las bases de los compuestos basados en carbono.",
    mastery: 45,
    icon: "FlaskConical",
    categories: ["Ciencia", "Química"],
    atoms: [
        { question: "¿Qué es un alcano?", answer: "Un hidrocarburo acíclico saturado, lo que significa que consiste en átomos de hidrógeno y carbono dispuestos en una estructura de árbol en la que todos los enlaces carbono-carbono son simples." },
    ],
    sessions: [
        { day: "Día 1", type: "Calibración", questions: "Opción múltiple", duration: "15 min", status: "Continue" },
    ],
    sources: [ {name: "Organic_Chemistry.pdf", type: "Documento"} ]
  },
];

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

    const addProject = (newProject: Omit<Project, 'sessions'> & { fullLearningPlanMarkdown: string, learningPath: any[] }) => {
    if (!projects.find(p => p.id === newProject.id)) {
      const projectWithSessions: Project = {
        ...newProject,
        sessions: newProject.learningPath.map((session: any) => ({
            day: `Día ${session.session}`,
            type: session.sessionType,
            questions: 'N/A', // This info is not directly available in learningPath
            duration: '20 min', // Default duration
            status: session.session === 1 ? 'Continue' : 'Locked'
        }))
      };
      setProjects(prevProjects => [...prevProjects, projectWithSessions]);
    }
  };

  const updateProjectIcon = (projectId: string, icon: string) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, icon: icon } : p
      )
    );
  };
  
  const updateProjectDetails = (projectId: string, title: string, description: string) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, title, description } : p
      )
    );
  }

  const addSessionsToProject = (projectId: string, newSessions: Omit<Session, 'status' | 'day'>[]) => {
      setProjects(prevProjects => {
          return prevProjects.map(p => {
              if (p.id === projectId) {
                  const existingSessions = p.sessions;
                  const nextDay = existingSessions.length + 1;
                  const formattedNewSessions: Session[] = newSessions.map((s, i) => ({
                      ...s,
                      day: `Día ${nextDay + i}`,
                      status: 'Locked',
                  }));
                  return { ...p, sessions: [...existingSessions, ...formattedNewSessions] };
              }
              return p;
          });
      });
  }

  const updateAtom = (projectId: string, atomIndex: number, updatedAtom: Atom) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newAtoms = [...p.atoms];
          newAtoms[atomIndex] = updatedAtom;
          return { ...p, atoms: newAtoms };
        }
        return p;
      })
    );
  };

  const deleteAtom = (projectId: string, atomIndex: number) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newAtoms = p.atoms.filter((_, index) => index !== atomIndex);
          return { ...p, atoms: newAtoms };
        }
        return p;
      })
    );
  };

  return (
    <ProjectContext.Provider value={{ projects, addProject, updateProjectIcon, updateProjectDetails, addSessionsToProject, updateAtom, deleteAtom }}>
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
