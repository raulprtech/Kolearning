
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
  session: number;
  type: string;
  questions: string;
  duration: string;
  status: 'Completed' | 'Continue' | 'Locked';
}

type LearningPathItem = {
    session: number;
    topic: string;
    sessionType: string;
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
  learningPath: LearningPathItem[];
  fullLearningPlanMarkdown?: string;
};

type ProjectContextType = {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProjectIcon: (projectId: string, icon: string) => void;
  updateProjectDetails: (projectId: string, title: string, description: string) => void;
  addSessionsToProject: (projectId: string, newSessions: Omit<Session, 'status' | 'session'>[]) => void;
  updateAtom: (projectId: string, atomIndex: number, updatedAtom: Atom) => void;
  deleteAtom: (projectId: string, atomIndex: number) => void;
  completeSession: (projectId: string, sessionIndex: number) => void;
  energy: number;
  streak: number;
  cognitiveCredits: number;
  masteryPoints: number;
  updateEnergy: (amount: number) => void;
  updateStreak: (correct: boolean) => void;
  resetStreak: () => void;
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
        { session: 1, type: "Calibración", questions: "Flashcards", duration: "20 min", status: "Continue" },
        { session: 2, type: "Refuerzo", questions: "Opción múltiple", duration: "30 min", status: "Locked" },
        { session: 3, type: "Dominio", questions: "Preguntas abiertas", duration: "25 min", status: "Locked" },
    ],
    learningPath: [
        { session: 1, topic: "Fundamentos de la Mecánica Cuántica", sessionType: "Calibración" },
        { session: 2, topic: "Superposición y Entrelazamiento", sessionType: "Incursión" },
        { session: 3, topic: "Repaso de Fundamentos", sessionType: "Refuerzo de Dominio" },
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
        { session: 1, type: "Incursión", questions: "Flashcards", duration: "25 min", status: "Continue" },
    ],
    learningPath: [
        { session: 1, topic: "La fundación de Roma y la República", sessionType: "Incursión" },
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
        { session: 1, type: "Calibración", questions: "Opción múltiple", duration: "15 min", status: "Continue" },
    ],
    learningPath: [
        { session: 1, topic: "Introducción a los hidrocarburos", sessionType: "Calibración" },
    ],
    sources: [ {name: "Organic_Chemistry.pdf", type: "Documento"} ]
  },
];

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [energy, setEnergy] = useState(20);
  const [streak, setStreak] = useState(0);
  const [cognitiveCredits, setCognitiveCredits] = useState(0);
  const [masteryPoints, setMasteryPoints] = useState(0);

    const addProject = (newProject: Omit<Project, 'sessions'> & { fullLearningPlanMarkdown: string, learningPath: any[] }) => {
    if (!projects.find(p => p.id === newProject.id)) {
      const projectWithSessions: Project = {
        ...newProject,
        sessions: newProject.learningPath.map((item, index) => ({
            session: item.session,
            type: item.sessionType,
            questions: 'N/A', // This info is not directly available in learningPath
            duration: '20 min', // Default duration
            status: index === 0 ? 'Continue' : 'Locked'
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

  const addSessionsToProject = (projectId: string, newSessions: Omit<Session, 'status' | 'session'>[]) => {
      setProjects(prevProjects => {
          return prevProjects.map(p => {
              if (p.id === projectId) {
                  const existingSessions = p.sessions;
                  const nextSessionNumber = (existingSessions[existingSessions.length - 1]?.session || 0) + 1;
                  const formattedNewSessions: Session[] = newSessions.map((s, i) => ({
                      ...s,
                      session: nextSessionNumber + i,
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
  
  const completeSession = (projectId: string, sessionIndex: number) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newSessions = [...p.sessions];
          // Mark current session as completed
          if (newSessions[sessionIndex]) {
            newSessions[sessionIndex].status = 'Completed';
          }
          // Unlock next session
          if (newSessions[sessionIndex + 1]) {
            newSessions[sessionIndex + 1].status = 'Continue';
          }
          return { ...p, sessions: newSessions };
        }
        return p;
      })
    );
  };

  const updateEnergy = (amount: number) => {
    setEnergy(prev => Math.max(0, prev + amount));
  };

  const updateStreak = (correct: boolean) => {
    if (correct) {
      setStreak(prev => prev + 1);
      setCognitiveCredits(prev => prev + 5);
      // Assuming 10 points for now, can be adjusted later with question type
      setMasteryPoints(prev => prev + 10);
    } else {
      setStreak(0);
    }
  };

  const resetStreak = () => {
    setStreak(0);
    setCognitiveCredits(0);
    setMasteryPoints(0);
  };

  return (
    <ProjectContext.Provider value={{ 
        projects, addProject, updateProjectIcon, updateProjectDetails, addSessionsToProject, 
        updateAtom, deleteAtom, completeSession,
        energy, streak, cognitiveCredits, masteryPoints,
        updateEnergy, updateStreak, resetStreak
    }}>
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
